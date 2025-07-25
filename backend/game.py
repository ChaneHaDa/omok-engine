class OmokGame:
    def __init__(self):
        self.board = [['' for _ in range(19)] for _ in range(19)]
        self.current_turn = 'black'

    def place_stone(self, x, y):
        if self.board[y][x] == '':
            self.board[y][x] = self.current_turn
            if self.check_win(x, y):
                return f"{self.current_turn} wins!"
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