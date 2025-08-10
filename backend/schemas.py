from __future__ import annotations

from typing import Literal, Optional, List, Dict, Any


Color = Literal['black', 'white']


class WsIn:
    """웹소켓 입력 메시지 스키마(간단한 유효성 검사용)."""

    action: Optional[Literal['new_game']]
    x: Optional[int]
    y: Optional[int]

    def __init__(self, data: Dict[str, Any]):
        self.action = data.get('action')
        self.x = data.get('x')
        self.y = data.get('y')


class WsOut:
    """웹소켓 출력 메시지 헬퍼."""

    @staticmethod
    def game_state(
        message: str,
        board: List[List[str]],
        move_numbers: List[List[int]],
        current_turn: Color,
        move_count: int,
        player_color: Optional[Color] = None,
        bot_move: Optional[dict] = None,
        error: Optional[str] = None,
    ) -> dict:
        payload: Dict[str, Any] = {
            'message': message,
            'board': board,
            'move_numbers': move_numbers,
            'current_turn': current_turn,
            'move_count': move_count,
        }
        if player_color is not None:
            payload['player_color'] = player_color
        if bot_move is not None:
            payload['bot_move'] = bot_move
        if error is not None:
            payload['error'] = error
        return payload


