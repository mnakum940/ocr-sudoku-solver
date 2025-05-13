from typing import List, Tuple, Optional
import numpy as np

class SudokuSolver:
    def __init__(self):
        self.size = 9
        self.box_size = 3
        self.solving_steps = []

    def is_valid(self, board: List[List[int]], row: int, col: int, num: int) -> bool:
        # Check row
        for x in range(self.size):
            if board[row][x] == num:
                return False

        # Check column
        for x in range(self.size):
            if board[x][col] == num:
                return False

        # Check box
        start_row = row - row % self.box_size
        start_col = col - col % self.box_size
        for i in range(self.box_size):
            for j in range(self.box_size):
                if board[i + start_row][j + start_col] == num:
                    return False

        return True

    def find_empty(self, board: List[List[int]]) -> Optional[Tuple[int, int]]:
        for i in range(self.size):
            for j in range(self.size):
                if board[i][j] == 0:
                    return (i, j)
        return None

    def solve(self, board: List[List[int]], track_steps: bool = False) -> Optional[List[List[int]]]:
        if track_steps:
            self.solving_steps = []
        
        def solve_recursive(board: List[List[int]]) -> bool:
            empty = self.find_empty(board)
            if not empty:
                return True

            row, col = empty
            for num in range(1, self.size + 1):
                if self.is_valid(board, row, col, num):
                    board[row][col] = num
                    if track_steps:
                        self.solving_steps.append({"row": row, "col": col, "value": num})
                    if solve_recursive(board):
                        return True
                    board[row][col] = 0
                    if track_steps:
                        self.solving_steps.append({"row": row, "col": col, "value": 0})
            return False

        if solve_recursive(board):
            return board
        return None

    def get_solving_steps(self) -> List[dict]:
        return self.solving_steps

    def validate_board(self, board: List[List[int]]) -> bool:
        # Check rows
        for row in board:
            if not self._is_valid_unit(row):
                return False

        # Check columns
        for col in range(self.size):
            column = [board[row][col] for row in range(self.size)]
            if not self._is_valid_unit(column):
                return False

        # Check boxes
        for box_row in range(0, self.size, self.box_size):
            for box_col in range(0, self.size, self.box_size):
                box = []
                for i in range(self.box_size):
                    for j in range(self.box_size):
                        box.append(board[box_row + i][box_col + j])
                if not self._is_valid_unit(box):
                    return False

        return True

    def _is_valid_unit(self, unit: List[int]) -> bool:
        # Remove zeros and check for duplicates
        numbers = [x for x in unit if x != 0]
        return len(numbers) == len(set(numbers))

    def generate_puzzle(self, difficulty: str = "medium") -> Tuple[List[List[int]], List[List[int]]]:
        # Generate a solved board
        board = [[0 for _ in range(self.size)] for _ in range(self.size)]
        self.solve(board)
        
        # Create a copy for the puzzle
        puzzle = [row[:] for row in board]
        
        # Remove numbers based on difficulty
        if difficulty == "easy":
            cells_to_remove = 30
        elif difficulty == "medium":
            cells_to_remove = 40
        else:  # hard
            cells_to_remove = 50

        # Randomly remove numbers
        positions = [(i, j) for i in range(self.size) for j in range(self.size)]
        np.random.shuffle(positions)
        
        for i, j in positions[:cells_to_remove]:
            puzzle[i][j] = 0

        return puzzle, board 