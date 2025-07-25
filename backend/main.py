from fastapi import FastAPI, WebSocket
from game import OmokGame

app = FastAPI()
game = OmokGame()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        x, y = data['x'], data['y']
        message = game.place_stone(x, y)
        await websocket.send_json({"message": message, "board": game.board})