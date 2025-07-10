from fastapi import WebSocketDisconnect
import asyncio
import json
from app.services.reading_tracker_service import ReadingTracker
from vosk import Model, KaldiRecognizer



async def translationConsumer(websocket, sharedQueue, reading_tracker: ReadingTracker):
    # model = Model("ml-models/vosk-model-en-us-0.22-lgraph")
    model = Model("ml-models/vosk-model-en-us-0.42-gigaspeech")

    rec = KaldiRecognizer(model, 16000)
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
    