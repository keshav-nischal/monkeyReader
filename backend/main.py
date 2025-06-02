from collections import deque
from pydub import AudioSegment
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from vosk import Model, KaldiRecognizer
import asyncio
import json
from enum import Enum
import re
from typing import List, Dict

# model = Model("models/vosk-model-en-us-0.22-lgraph")
model = Model("models/vosk-model-en-us-0.42-gigaspeech")

rec = KaldiRecognizer(model, 16000)
#server
app = FastAPI(
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=["*"], 
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        ),
        Middleware(
            TrustedHostMiddleware,
            allowed_hosts=["*"],
        )
    ]
)


@app.get("/")
async def read_root():
    return {"message": "Server is running"}


async def micDataProducer(websocket, shared_stream_queue, complete_recording_stream):
    try:
        while True:
            data = await websocket.receive_bytes()
            # print(data)
            shared_stream_queue.append(data)
            complete_recording_stream.append(data)
            # await websocket.send_text(f"Received {len(data)} bytes")
    except WebSocketDisconnect:
        print("WebSocket disconnected in publisher")
    except Exception as e:
        print(f"Error in publisher: {e}")


class Mark(Enum):
    UNREAD = 0 
    CORRECTLY_READ = 1
    INCORRECTLY_READ = 2

class Passage:
    def __init__(self, text: str):
        self.words = self._tokenize(text)
        self.marks: List[Mark] = [Mark.UNREAD] * len(self.words)
        
    def to_dict(self):
        return {"passage": self.words, "marks": [mark.value for mark in self.marks]}
    
    def _tokenize(self, text: str) -> List[str]:
        # Convert text to lowercase and extract word tokens similar to VOSK model output.
        return re.findall(r'\b\w+\b', text.lower())

    def __str__(self) -> str:
        GREEN = '\033[92m'  # Bright green
        RED = '\033[91m'    # Bright red
        RESET = '\033[0m'   # Reset to default color
        
        colored_words = []
        for i, word in enumerate(self.words):
            mark = self.marks[i]
            if mark == Mark.CORRECTLY_READ:
                colored_words.append(f"{GREEN}{word}{RESET}")
            elif mark == Mark.INCORRECTLY_READ:
                colored_words.append(f"{RED}{word}{RESET}")
            else:
                colored_words.append(word)
        return ' '.join(colored_words)

    def __repr__(self) -> str:
        GREEN = '\033[92m'
        RED = '\033[91m'
        RESET = '\033[0m'
        
        correct_count = sum(1 for mark in self.marks if mark == Mark.CORRECTLY_READ)
        incorrect_count = sum(1 for mark in self.marks if mark == Mark.INCORRECTLY_READ)
        unread_count = sum(1 for mark in self.marks if mark == Mark.UNREAD)
        
        stats = (f"Passage(words={len(self.words)}, "
                    f"correct={correct_count}, incorrect={incorrect_count}, "
                    f"unread={unread_count})\n")
        
        legend = (f"Legend: {GREEN}Correct{RESET} | {RED}Incorrect{RESET} | Plain=Unread\n")
        
        return stats + legend + self.__str__()


class WordMatcher:
    def __init__(self, look_ahead_factor: int = 8):
        self.look_ahead_factor = look_ahead_factor

    def match_and_mark(self, model_tokens: List[str], passage: Passage, last_correctly_marked_pos: int) -> int:
        words = passage.words
        marks = passage.marks
        last_model_token_used_idx = -1
        for i in range(last_correctly_marked_pos+1, len(words)):
            if(i-last_correctly_marked_pos > self.look_ahead_factor):
                break
            for j in range(last_model_token_used_idx+1, min(len(model_tokens), last_model_token_used_idx+1+self.look_ahead_factor)):
                if(words[i]==model_tokens[j]):
                    # if(i-last_pos)
                    for k in range(last_correctly_marked_pos+1, i):
                        marks[k] = Mark.INCORRECTLY_READ
                    marks[i] = Mark.CORRECTLY_READ
                    last_correctly_marked_pos = i
                    last_model_token_used_idx = j
                    break
        return last_correctly_marked_pos

class ReadingTracker:
    def __init__(self, passage: Passage, matcher: WordMatcher):
        self.passage = passage
        self.last_marked_word_pos = -1
        self.matcher = matcher

    def mark_sentence(self, model_tokens: List[str]):
        mark_details = {"start_idx": self.last_marked_word_pos + 1, "end_idx": -1, "marks": []}
        self.last_marked_word_pos = self.matcher.match_and_mark(
            model_tokens, self.passage, self.last_marked_word_pos
        )
        mark_details['end_idx'] = self.last_marked_word_pos
        mark_details['marks'] = [self.passage.marks[i].value for i in range(mark_details["start_idx"], mark_details["end_idx"] + 1)]
        return mark_details
    def mark_sentence_rough(self, model_tokens: List[str]):
        mark_details = {"start_idx": self.last_marked_word_pos + 1, "end_idx": -1, "marks": []}
        lastPos = self.matcher.match_and_mark(
            model_tokens, self.passage, self.last_marked_word_pos
        )
        mark_details['end_idx'] = lastPos
        mark_details['marks'] = [self.passage.marks[i].value for i in range(mark_details["start_idx"], mark_details["end_idx"] + 1)]
        return mark_details
    def __str__(self) -> str:
        return str(self.passage)

    def __repr__(self) -> str:
        return repr(self.passage)



async def translationConsumer(websocket, sharedQueue, reading_tracker: ReadingTracker):
    try: 
        while True:
            if len(sharedQueue) > 0:
                stream = sharedQueue.popleft()  # Use popleft() for FIFO behavior
                try:
                    
                    if rec.AcceptWaveform(stream):
                        # Got a full segment (sentence or phrase)
                        result = json.loads(rec.Result())
                        print("Final segment:", result["text"])
                        # Send result back through websocket
                        marking_details = reading_tracker.mark_sentence(result["text"].split(" "))
                        print(marking_details)
                        await websocket.send_text(json.dumps({
                            "type": "final",
                            "text": result["text"]
                        }))
                        # Convert enum members to their numeric values before sending
                        
                        await websocket.send_json({"ws_msg_type": "marking_details", "content": marking_details})

                    else:
                        partial = json.loads(rec.PartialResult())
                        # print("Partial:", partial["partial"])
                        # await websocket.send_text(json.dumps({
                        #     "type": "partial", 
                        #     "text": partial["partial"]
                        # }))
                        marking_details = reading_tracker.mark_sentence_rough(partial["partial"].split(" "))
                        await websocket.send_json({"ws_msg_type": "marking_details", "content": marking_details})


                        # await websocket.send_text(json.dumps({"ws_msg_type": "final", "data": mark_details}))

                        
                except Exception as decode_error:
                    print(f"Error decoding audio: {decode_error}")
            else:
                # Small delay to prevent busy waiting
                await asyncio.sleep(0.01)
                
    except WebSocketDisconnect:
        print("WebSocket disconnected in subscriber")
    except Exception as err:
        print(f"Error in subscriber: {err}")
    
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    passage_string = "The cat sits on the mat. It is a sunny day. The bird flies in the sky. I like to read books. We go to the park today. My friend has a red car. She drives to work every day. The store is open now. I need to buy some milk and bread. The children play in the yard. The dog runs fast. It likes to catch the ball. We eat lunch at noon. The food tastes good. My mom cooks very well.The house is big and white. It has three rooms. The garden has many flowers. They are red and yellow. The tree gives good shade.I wake up early in the morning. The sun comes up slowly. Birds make nice sounds. I drink coffee and read the news. Then I get ready for work.The weather is nice today. It is not too hot or cold. People walk outside and smile. Kids ride their bikes on the street. Everyone seems happy.At night we watch TV together. The shows are funny. We laugh a lot. Then we go to sleep. Tomorrow will be another good day.The water in the lake is clear. Fish swim near the rocks. We can see them from the boat. It is peaceful here."
    await websocket.accept()

    passage = Passage(passage_string)
    passage_details = passage.to_dict()
    await websocket.send_json({"ws_msg_type": "passage_details", "content": passage_details})

    shared_stream_queue = deque()

    complete_recording_stream = []
    reading_tracker = ReadingTracker(passage, WordMatcher())

    # Create tasks to run both jobs concurrently
    mic_stream_task = asyncio.create_task(
        micDataProducer(websocket, shared_stream_queue, complete_recording_stream)
    )
    translation_task = asyncio.create_task(
        translationConsumer(websocket, shared_stream_queue, reading_tracker)
    )
    
    try:
        done, pending = await asyncio.wait(
            [mic_stream_task, translation_task], 
            return_when=asyncio.FIRST_COMPLETED
        )
        
        for task in pending:
            task.cancel()
            
    except Exception as e:
        print(f"WebSocket endpoint error: {e}")
    finally:
        # Cleanup
        if not mic_stream_task.done():
            mic_stream_task.cancel()
        if not translation_task.done():
            translation_task.cancel()
        
        try:
            await websocket.close()
        except:
            pass

def main():
    uvicorn.run("main:app", host="127.0.0.1", port=8012, reload=True)
    # passage_string = "He paused, his eyes darting to the telescreen, a square of frosted glass that dominated one wall. It was always watching, always listening. Even in his tiny, squalid flat, there was no escape. The thought of Julia, and the few illicit moments they had stolen, sent a flicker of warmth through him, quickly extinguished by the ever-present dread. He knew the risks. Everyone knew. A whisper, a glance, an unspoken thought any deviation from the Party line could mean torture, re-education, or worse, vaporisation. His own memory was a minefield, constantly being reshaped by the Ministry of Truth, leaving him with a gnawing uncertainty about even the most basic facts. He picked up his pen, a forbidden act in itself, and hesitated. To write was to commit a thought to paper, an undeniable act of defiance. The very air seemed to thicken with the unspoken laws that governed every breath."
    passage_string = "The cat sits on the mat. It is a sunny day. The bird flies in the sky. I like to read books. We go to the park today. My friend has a red car. She drives to work every day. The store is open now. I need to buy some milk and bread. The children play in the yard. The dog runs fast. It likes to catch the ball. We eat lunch at noon. The food tastes good. My mom cooks very well.The house is big and white. It has three rooms. The garden has many flowers. They are red and yellow. The tree gives good shade.I wake up early in the morning. The sun comes up slowly. Birds make nice sounds. I drink coffee and read the news. Then I get ready for work.The weather is nice today. It is not too hot or cold. People walk outside and smile. Kids ride their bikes on the street. Everyone seems happy.At night we watch TV together. The shows are funny. We laugh a lot. Then we go to sleep. Tomorrow will be another good day.The water in the lake is clear. Fish swim near the rocks. We can see them from the boat. It is peaceful here."
    passage = Passage(passage_string)
    t = ReadingTracker(passage, WordMatcher())
    l1 = "the he bought his eyes darting to the tennessee".split(" ")
    l2 = "he bought his eyes darting to the telescope me".split(" ")
    l3 = "the cat sits on the mat it is a sunny day the bird slides in the sky i like to read books is a sunny day the bird flies in this guy".split(" ")
    print(t.mark_sentence(l3))
    print(t)
    print([mark.value for mark in passage.marks])
    # l2 = 


if __name__ == "__main__":
    main()
