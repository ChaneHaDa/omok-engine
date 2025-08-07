class OmokGame:
    def __init__(self):
        self.board = [['' for _ in range(19)] for _ in range(19)]
        self.move_numbers = [[0 for _ in range(19)] for _ in range(19)]  # 각 위치의 차례 번호
        self.current_turn = 'black'
        self.move_count = 0  # 전체 차례 수

    def place_stone(self, x, y):
        if self.board[y][x] == '':
            self.move_count += 1
            self.board[y][x] = self.current_turn
            self.move_numbers[y][x] = self.move_count  # 차례 번호 저장
            
            if self.check_win(x, y):
                turn_name = "흑돌" if self.current_turn == 'black' else "백돌"
                return f"{self.current_turn} wins! ({turn_name} 차례에 오목 완성! - {self.move_count}번째 수)"
            self.current_turn = 'white' if self.current_turn == 'black' else 'black'
            return "Stone placed"
        else:
            return "Invalid move"

    def check_win(self, x, y):
        stone = self.board[y][x]
        if stone == '':
            return False

        directions = [(1, 0), (0, 1), (1, 1), (1, -1)]
        for dx, dy in directions:
            count = 1
            for i in range(1, 5):
                nx, ny = x + i * dx, y + i * dy
                if 0 <= nx < 19 and 0 <= ny < 19 and self.board[ny][nx] == stone:
                    count += 1
                else:
                    break
            for i in range(1, 5):
                nx, ny = x - i * dx, y - i * dy
                if 0 <= nx < 19 and 0 <= ny < 19 and self.board[ny][nx] == stone:
                    count += 1
                else:
                    break
            if count >= 5:
                return True
        return False