from __future__ import annotations

import random
from typing import Optional

from game import OmokGame
from services.bot import RandomBot


class GameService:
    def __init__(self):
        self.game: Optional[OmokGame] = None
        self.bot = RandomBot()
        self.player_color: Optional[str] = None

    def start_new_game(self) -> tuple[str, str]:
        """새 게임을 시작하고 플레이어 색상을 반환합니다."""
        self.game = OmokGame()
        self.player_color = random.choice(['black', 'white'])
        return 'New game started', self.player_color

    def is_bot_turn(self) -> bool:
        """현재 턴이 봇의 턴인지 확인합니다."""
        if not self.game or not self.player_color:
            return False
        return self.game.current_turn != self.player_color

    def validate_move(self, x: Optional[int], y: Optional[int]) -> Optional[str]:
        """수의 유효성을 검사하고 에러 메시지를 반환합니다."""
        if x is None or y is None:
            return "Missing required keys: 'x' and 'y'"
        
        if not isinstance(x, int) or not isinstance(y, int):
            return 'Coordinates must be integers'
        
        if x < 0 or x >= 19 or y < 0 or y >= 19:
            return 'Coordinates out of range (0-18)'
        
        if self.player_color and self.game.current_turn != self.player_color:
            return 'Not your turn'
        
        return None

    def place_player_stone(self, x: int, y: int) -> str:
        """플레이어가 돌을 놓습니다."""
        if not self.game:
            return 'Game not started'
        return self.game.place_stone(x, y)

    def place_bot_stone(self) -> tuple[str, Optional[dict]]:
        """봇이 돌을 놓고 결과를 반환합니다."""
        if not self.game:
            return 'Game not started', None
        
        choice = self.bot.choose_move(self.game.board)
        if choice is None:
            return 'Board full', None
        
        x, y = choice
        message = self.game.place_stone(x, y)
        bot_move = {'x': x, 'y': y}
        
        if 'wins' in message:
            return message, bot_move
        return 'Bot moved', bot_move

    def get_game_state(self) -> dict:
        """현재 게임 상태를 반환합니다."""
        if not self.game:
            return {}
        
        return {
            'board': self.game.board,
            'move_numbers': self.game.move_numbers,
            'current_turn': self.game.current_turn,
            'move_count': self.game.move_count,
            'player_color': self.player_color,
        }