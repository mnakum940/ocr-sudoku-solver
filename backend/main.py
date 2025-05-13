import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
import tempfile
from backend.sudoku_solver import SudokuSolver
from backend.image_processor import SudokuImageProcessor
from backend.generator import SudokuGenerator
# If SudokuGenerator is needed and defined in backend/sudoku_solver.py, import it as well
# from backend.sudoku_solver import SudokuGenerator

app = FastAPI(title="Sudoku Solver API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://ocr-sudoku-solver.netlify.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SudokuBoard(BaseModel):
    board: List[List[int]]

class SudokuResponse(BaseModel):
    board: List[List[int]]
    message: Optional[str] = None
    source_map: Optional[List[List[str]]] = None  # 'ocr' or 'empty'
    steps: Optional[List[dict]] = None  # Solving steps for animation

class GenerateResponse(BaseModel):
    puzzle: List[List[int]]
    solution: List[List[int]]

solver = SudokuSolver()
# For generator and image processor, import from their actual files if present, or comment out if not used
image_processor = SudokuImageProcessor()

generator = SudokuGenerator()

@app.get("/")
async def root():
    return {"message": "Welcome to Sudoku Solver API"}

@app.post("/solve", response_model=SudokuResponse)
async def solve_sudoku(board: SudokuBoard, show_steps: bool = False):
    if not solver.validate_board(board.board):
        raise HTTPException(status_code=400, detail="Invalid Sudoku board")
    board_copy = [row[:] for row in board.board]
    solved = solver.solve(board_copy, track_steps=show_steps)
    if not solved:
        raise HTTPException(status_code=400, detail="No solution exists")
    return SudokuResponse(
        board=board_copy,
        message="Puzzle solved successfully",
        steps=solver.get_solving_steps() if show_steps else None
    )

@app.post("/validate")
async def validate_board(board: SudokuBoard):
    is_valid = solver.validate_board(board.board)
    return {"is_valid": is_valid}

@app.get("/generate", response_model=GenerateResponse)
async def generate_puzzle(difficulty: str = "medium"):
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Invalid difficulty level")
    puzzle = generator.generate_puzzle(difficulty)
    solution = [row[:] for row in puzzle]
    solver.solve(solution)
    return GenerateResponse(puzzle=puzzle, solution=solution)

@app.post("/process-image", response_model=SudokuResponse)
async def process_image(image: UploadFile = File(...)):
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=422,
            detail="Invalid file type. Please upload an image file (JPEG, PNG, etc.)"
        )

    try:
        # Save uploaded image to a temporary file
        contents = await image.read()
        if len(contents) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(
                status_code=413,
                detail="Image file is too large. Maximum size is 5MB."
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            # Use robust processor pipeline
            processor = SudokuImageProcessor()
            img = cv2.imread(tmp_path)
            if img is None:
                raise HTTPException(
                    status_code=422,
                    detail="Failed to read image. Please ensure it's a valid image file."
                )

            preprocessed = processor.preprocess_image(img)
            if preprocessed is None:
                raise HTTPException(
                    status_code=422,
                    detail="Failed to preprocess image. Please try a clearer image."
                )

            grid = processor.find_grid(preprocessed)
            if grid is None:
                raise HTTPException(
                    status_code=422,
                    detail="Could not detect a Sudoku grid in the image. Please ensure the grid is clearly visible."
                )

            cells = processor.extract_cells(grid)
            if len(cells) != 81:
                raise HTTPException(
                    status_code=422,
                    detail="Failed to extract all cells from the grid. Please ensure the grid is complete and well-lit."
                )

            # Multi-pass recognition
            methods = [
                ("otsu", False),
                ("adaptive_mean", False),
                ("adaptive_gaussian", False),
                ("otsu", True),
                ("adaptive_mean", True),
                ("adaptive_gaussian", True),
            ]
            best_board = None
            best_score = -1
            best_method = None

            for thresholding, use_clahe in methods:
                try:
                    board = processor.recognize_digits(
                        cells, margin_ratio=0.17, thresholding=thresholding, psm=6, use_clahe=use_clahe
                    )
                    # Filter: only allow 1-9, set others to 0
                    for i in range(9):
                        for j in range(9):
                            if not (1 <= board[i][j] <= 9):
                                board[i][j] = 0
                    score = sum(1 for row in board for d in row if 1 <= d <= 9)
                    if score > best_score:
                        best_score = score
                        best_board = board
                        best_method = f"{thresholding}{' + CLAHE' if use_clahe else ''}"
                except Exception as e:
                    print(f"Error in recognition method {thresholding}: {str(e)}")
                    continue

            if best_board is None:
                raise HTTPException(
                    status_code=422,
                    detail="Failed to recognize any digits in the image. Please try a clearer image with better contrast."
                )

            if best_score < 10:  # If we recognized very few digits
                raise HTTPException(
                    status_code=422,
                    detail="Could not recognize enough digits in the image. Please try a clearer image with better contrast."
                )

            # Build source_map for frontend coloring
            source_map = [["user" if 1 <= best_board[i][j] <= 9 else "empty" for j in range(9)] for i in range(9)]
            return SudokuResponse(
                board=best_board,
                message=f"Image processed ({best_score} digits recognized, method: {best_method}). You can edit any recognized digits.",
                source_map=source_map
            )

        finally:
            # Clean up the temporary file
            try:
                os.unlink(tmp_path)
            except Exception as e:
                print(f"Error deleting temporary file: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
