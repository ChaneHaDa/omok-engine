from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from schemas import WsIn, WsOut
from services.game_service import GameService


router = APIRouter()


async def send_game_state(websocket: WebSocket, game_service: GameService, message: str, *, bot_move=None, error=None):
    try:
        game_state = game_service.get_game_state()
        await websocket.send_json(
            WsOut.game_state(
                message=message,
                board=game_state.get('board', []),
                move_numbers=game_state.get('move_numbers', []),
                current_turn=game_state.get('current_turn'),
                move_count=game_state.get('move_count', 0),
                player_color=game_state.get('player_color'),
                bot_move=bot_move,
                error=error,
            )
        )
    except WebSocketDisconnect:
        return


@router.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    game_service = GameService()
    
    # 연결 시 자동으로 새 게임 시작
    message, _ = game_service.start_new_game()
    await send_game_state(websocket, game_service, message)
    
    # 봇이 선공이면 첫 수를 둠
    if game_service.is_bot_turn():
        bot_message, bot_move = game_service.place_bot_stone()
        await send_game_state(websocket, game_service, bot_message, bot_move=bot_move)

    async def send_state(message: str, *, bot_move=None, error=None):
        await send_game_state(websocket, game_service, message, bot_move=bot_move, error=error)

    try:
        while True:
            data = await websocket.receive_json()
            payload = WsIn(data)

            if payload.action == 'new_game':
                message, _ = game_service.start_new_game()
                await send_state(message)
                
                if game_service.is_bot_turn():
                    bot_message, bot_move = game_service.place_bot_stone()
                    await send_state(bot_message, bot_move=bot_move)
                continue

            error_message = game_service.validate_move(payload.x, payload.y)
            if error_message:
                await send_state(error_message, error=error_message)
                continue

            message = game_service.place_player_stone(payload.x, payload.y)
            await send_state(message)

            if message == 'Stone placed':
                bot_message, bot_move = game_service.place_bot_stone()
                await send_state(bot_message, bot_move=bot_move)
    except WebSocketDisconnect:
        pass


