from dotenv import load_dotenv
import os

from sqlalchemy import select
load_dotenv()
from collections import deque
from fastapi import Depends, FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
import uvicorn
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
import asyncio

from app.database.main import Base, get_sql_session, engine
from app.models import Book, UserBookRelation, UserBookProgress
from app.services.reading_tracker_service import Passage, ReadingTracker, WordMatcher
from app.services.mic_stream_service import micDataProducer
from app.services.translate_service import translationConsumer  
from app.services.auth_service import verify_token_and_get_user
from dotenv import load_dotenv

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

@app.get("/books/all")   
async def all_books(sql_session = Depends(get_sql_session)):
    all_books_query = select(Book)
    books = sql_session.scalars(all_books_query).all()
    return books

@app.get("/books/owned")
async def owned_books(detailed, user = Depends(verify_token_and_get_user), sql_session = Depends(get_sql_session)):
    stmt = select(UserBookRelation.book_id).where(
        UserBookRelation.user_id == user.uid,
        UserBookRelation.relation_type == UserBookRelation.RelationType.OWNED
    )

    owned_book_ids = sql_session.scalars(stmt).all()
    if(detailed):
        stmt = select(UserBookProgress).where(UserBookProgress.book_id in owned_book_ids)
    return owned_book_ids
        

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
        except Exception:
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
  

if __name__ == "__main__":
    main()
