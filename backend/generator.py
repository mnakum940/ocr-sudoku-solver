from typing import List, Tuple
import numpy as np
from .sudoku_solver import SudokuSolver

class SudokuGenerator:
    def __init__(self):
        self.solver = SudokuSolver()
        self.size = 9

    def generate_puzzle(self, difficulty: str = "medium") -> List[List[int]]:
        # Generate a solved board
        board = [[0 for _ in range(self.size)] for _ in range(self.size)]
        self.solver.solve(board)
        
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

        return puzzle 