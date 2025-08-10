from __future__ import annotations

import random
from typing import List, Tuple


class RandomBot:
    """가장 단순한 랜덤 봇. 빈 칸 중 하나를 무작위로 선택한다."""

    def choose_move(self, board: List[List[str]]) -> Tuple[int, int] | None:
        empty_cells = [
            (x, y)
            for y in range(19)
            for x in range(19)
            if board[y][x] == ''
        ]
        if not empty_cells:
            return None
        return random.choice(empty_cells)


