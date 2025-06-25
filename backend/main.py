from collections import deque
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
import asyncio

from services.reading_tracker_service import Passage, ReadingTracker, WordMatcher
from services.mic_stream_service import micDataProducer
from services.translate_service import translationConsumer  
from services.auth_service import verify_token_and_get_user
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

@app.get("/auth/verifyToken")
async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    [token_type, token] = auth_header.split(" ")
    if(token_type == "Bearer"):
        verify_token_and_get_user(token)
    else:
        raise HTTPException(401, "token type is not present")

@app.get("books/all")   
async def all_books():
    books = [
        {"title": "1984", "author": "George Orwell", "totalPages": 328, "pagesRead": 0, "BookSymbol": "Rocket"},
        {"title": "Brave New World", "author": "Aldous Huxley", "totalPages": 311, "pagesRead": 124, "BookSymbol": "Brain"},
        {"title": "To Kill a Mockingbird", "author": "Harper Lee", "totalPages": 281, "pagesRead": 50, "BookSymbol": "Ghost"},
        {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "totalPages": 180, "pagesRead": 180, "BookSymbol": "Star"},
    ]
    return books


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

#auth -> check the  book owning status, history for current page number -> get content -> start the timer -> reading and transalations ->  end timer check if the page has been read or not(by checking if the last word is marked and if the 80 percent of content was read correctly) -> mark the history ->
def main():
    uvicorn.run("main:app", host="127.0.0.1", port=8012, reload=True)
    # # passage_string = "He paused, his eyes darting to the telescreen, a square of frosted glass that dominated one wall. It was always watching, always listening. Even in his tiny, squalid flat, there was no escape. The thought of Julia, and the few illicit moments they had stolen, sent a flicker of warmth through him, quickly extinguished by the ever-present dread. He knew the risks. Everyone knew. A whisper, a glance, an unspoken thought any deviation from the Party line could mean torture, re-education, or worse, vaporisation. His own memory was a minefield, constantly being reshaped by the Ministry of Truth, leaving him with a gnawing uncertainty about even the most basic facts. He picked up his pen, a forbidden act in itself, and hesitated. To write was to commit a thought to paper, an undeniable act of defiance. The very air seemed to thicken with the unspoken laws that governed every breath."
    # passage_string = "The cat sits on the mat. It is a sunny day. The bird flies in the sky. I like to read books. We go to the park today. My friend has a red car. She drives to work every day. The store is open now. I need to buy some milk and bread. The children play in the yard. The dog runs fast. It likes to catch the ball. We eat lunch at noon. The food tastes good. My mom cooks very well.The house is big and white. It has three rooms. The garden has many flowers. They are red and yellow. The tree gives good shade.I wake up early in the morning. The sun comes up slowly. Birds make nice sounds. I drink coffee and read the news. Then I get ready for work.The weather is nice today. It is not too hot or cold. People walk outside and smile. Kids ride their bikes on the street. Everyone seems happy.At night we watch TV together. The shows are funny. We laugh a lot. Then we go to sleep. Tomorrow will be another good day.The water in the lake is clear. Fish swim near the rocks. We can see them from the boat. It is peaceful here."
    # passage = Passage(passage_string)
    # t = ReadingTracker(passage, WordMatcher())
    # l1 = "the he bought his eyes darting to the tennessee".split(" ")
    # l2 = "he bought his eyes darting to the telescope me".split(" ")
    # l3 = "the cat sits on the mat it is a sunny day the bird slides in the sky i like to read books is a sunny day the bird flies in this guy".split(" ")
    # print(t.mark_sentence(l3))
    # print(t)
    # print([mark.value for mark in passage.marks])
    # l2 = 
    # result = verify_token_and_get_user("eyJhbGciOiJSUzI1NiIsImtpZCI6ImE0YTEwZGVjZTk4MzY2ZDZmNjNlMTY3Mjg2YWU5YjYxMWQyYmFhMjciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9ua2V5LXJlYWQtODA0MWYiLCJhdWQiOiJtb25rZXktcmVhZC04MDQxZiIsImF1dGhfdGltZSI6MTc1MDAyNDI0MCwidXNlcl9pZCI6IkpKZkYwaThGSDVZY1ZnSWpMOHIwV28wVEt2dDEiLCJzdWIiOiJKSmZGMGk4Rkg1WWNWZ0lqTDhyMFdvMFRLdnQxIiwiaWF0IjoxNzUwMDI0MjQwLCJleHAiOjE3NTAwMjc4NDAsImVtYWlsIjoia2VzaGF2bmlzY2hhbEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJrZXNoYXZuaXNjaGFsQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.McaDm0LKYOqGm7CfOOn6SPJH9Tdgx_bJGupSt7tIW2qx4GhWnL5l7_ptFPYAcKmc16ZmBpdI87dYhbY6GeExYZZ7lyFVC4o0NbQ3vjXv3N7f0MOvjyR6sapdg0DU-8JrZ6dGgDUSZN4unJQWk-mtpFUtMRmAFf7iLdGlRU8EiFG-t0PTDLYlxhuunOwKkD9rLcslnsAoWysjwP708qBscr8k2XTIF-WFHndjDEq4vn9Wkmx39YinC2cb52XiQVu7JWLkvQe_20TJPIRKfQqVMjXKoIQbwS4ALS40t0wnNQm4DjAjx4MSfCjAnOTzUU2tBn9mfyD2z7BPGIRRYdncDg")
    # print(result)

if __name__ == "__main__":
    main()
