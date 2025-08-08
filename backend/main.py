from fastapi import FastAPI, WebSocket
from game import OmokGame
import json
import random

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Assign player's color per-connection on new game
    player_color = None  # 'black' or 'white'
    # Create a per-connection game state (no shared board between clients)
    game = OmokGame()

    async def bot_move():
        # Choose a random empty cell and place the bot's stone
        empty = [(x, y) for y in range(19) for x in range(19) if game.board[y][x] == '']
        if not empty:
            await websocket.send_json({
                "message": "Board full",
                "board": game.board,
                "move_numbers": game.move_numbers,
                "current_turn": game.current_turn,
                "move_count": game.move_count
            })
            return
        x, y = random.choice(empty)
        message = game.place_stone(x, y)
        await websocket.send_json({
            "message": message if 'wins' in message else "Bot moved",
            "bot_move": {"x": x, "y": y},
            "board": game.board,
            "move_numbers": game.move_numbers,
            "current_turn": game.current_turn,
            "move_count": game.move_count
        })
    while True:
        try:
            data = await websocket.receive_json()
            
            # 새 게임 시작 액션 처리
            if 'action' in data and data['action'] == 'new_game':
                # Initialize per-connection game and randomly assign player color
                game = OmokGame()
                player_color = random.choice(['black', 'white'])
                # Inform client of assignment and current board
                await websocket.send_json({
                    "message": "New game started",
                    "player_color": player_color,
                    "board": game.board,
                    "move_numbers": game.move_numbers,
                    "current_turn": game.current_turn,
                    "move_count": game.move_count
                })
                # If bot starts, make a move immediately
                if player_color != game.current_turn:
                    await bot_move()
                continue
            
            # 필수 키 확인
            if 'x' not in data or 'y' not in data:
                await websocket.send_json({
                    "error": "Missing required keys: 'x' and 'y'",
                    "board": game.board,
                    "move_numbers": game.move_numbers,
                    "current_turn": game.current_turn,
                    "move_count": game.move_count
                })
                continue
            
            x, y = data['x'], data['y']
            
            # 좌표 유효성 검사
            if not isinstance(x, int) or not isinstance(y, int):
                await websocket.send_json({
                    "error": "Coordinates must be integers",
                    "board": game.board,
                    "move_numbers": game.move_numbers,
                    "current_turn": game.current_turn,
                    "move_count": game.move_count
                })
                continue
                
            if x < 0 or x >= 19 or y < 0 or y >= 19:
                await websocket.send_json({
                    "error": "Coordinates out of range (0-18)",
                    "board": game.board,
                    "move_numbers": game.move_numbers,
                    "current_turn": game.current_turn,
                    "move_count": game.move_count
                })
                continue
            
            # Enforce turn: ignore moves when it's not player's turn
            if player_color is not None and game.current_turn != player_color:
                await websocket.send_json({
                    "error": "Not your turn",
                    "board": game.board,
                    "move_numbers": game.move_numbers,
                    "current_turn": game.current_turn,
                    "move_count": game.move_count
                })
                continue

            message = game.place_stone(x, y)
            await websocket.send_json({
                "message": message,
                "board": game.board,
                "move_numbers": game.move_numbers,
                "current_turn": game.current_turn,
                "move_count": game.move_count
            })

            # If player didn't win, trigger bot's move
            if 'wins' not in message:
                await bot_move()
            
        except json.JSONDecodeError:
            await websocket.send_json({
                "error": "Invalid JSON format",
                "board": game.board,
                "move_numbers": game.move_numbers,
                "current_turn": game.current_turn,
                "move_count": game.move_count
            })
        except Exception as e:
            await websocket.send_json({
                "error": f"Server error: {str(e)}",
                "board": game.board,
                "move_numbers": game.move_numbers,
                "current_turn": game.current_turn,
                "move_count": game.move_count
            })
