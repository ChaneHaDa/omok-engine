from __future__ import annotations

from fastapi import APIRouter, WebSocket

from game import OmokGame
from schemas import WsIn, WsOut
from services.bot import RandomBot


router = APIRouter()


@router.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    player_color = None  # 'black' or 'white'
    game = OmokGame()
    bot = RandomBot()

    async def send_state(message: str, *, player_color_field=None, bot_move=None, error=None):
        await websocket.send_json(
            WsOut.game_state(
                message=message,
                board=game.board,
                move_numbers=game.move_numbers,
                current_turn=game.current_turn,
                move_count=game.move_count,
                player_color=player_color_field,
                bot_move=bot_move,
                error=error,
            )
        )

    async def bot_move_turn():
        choice = bot.choose_move(game.board)
        if choice is None:
            await send_state('Board full')
            return
        x, y = choice
        message = game.place_stone(x, y)
        await send_state('Bot moved' if 'wins' not in message else message, bot_move={'x': x, 'y': y})

    while True:
        data = await websocket.receive_json()
        payload = WsIn(data)

        if payload.action == 'new_game':
            game = OmokGame()
            # 흑/백 랜덤 배정
            import random as _random
            player_color = _random.choice(['black', 'white'])
            await send_state('New game started', player_color_field=player_color)
            # 봇 선공이면 즉시 수
            if player_color != game.current_turn:
                await bot_move_turn()
            continue

        # 좌표 메시지 유효성 검사
        if payload.x is None or payload.y is None:
            await send_state("Missing required keys: 'x' and 'y'", error="Missing required keys: 'x' and 'y'")
            continue

        x, y = payload.x, payload.y
        if not isinstance(x, int) or not isinstance(y, int):
            await send_state('Coordinates must be integers', error='Coordinates must be integers')
            continue
        if x < 0 or x >= 19 or y < 0 or y >= 19:
            await send_state('Coordinates out of range (0-18)', error='Coordinates out of range (0-18)')
            continue
        if player_color is not None and game.current_turn != player_color:
            await send_state('Not your turn', error='Not your turn')
            continue

        message = game.place_stone(x, y)
        await send_state(message)

        if message == 'Stone placed':
            await bot_move_turn()


