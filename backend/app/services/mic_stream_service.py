from fastapi import WebSocketDisconnect


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
