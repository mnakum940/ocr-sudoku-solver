import cv2
import numpy as np
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
from typing import List, Tuple, Optional
import os

class SudokuImageProcessor:
    def __init__(self):
        self.size = 9
        self.box_size = 3

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (9, 9), 0)
        thresh = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        thresh = cv2.bitwise_not(thresh)
        return thresh

    def find_grid(self, image: np.ndarray) -> Optional[np.ndarray]:
        contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        largest_contour = max(contours, key=cv2.contourArea)
        peri = cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, 0.02 * peri, True)
        if len(approx) != 4:
            return None
        pts = approx.reshape(4, 2)
        rect = self._order_points(pts)
        (tl, tr, br, bl) = rect
        widthA = np.linalg.norm(br - bl)
        widthB = np.linalg.norm(tr - tl)
        maxWidth = max(int(widthA), int(widthB))
        heightA = np.linalg.norm(tr - br)
        heightB = np.linalg.norm(tl - bl)
        maxHeight = max(int(heightA), int(heightB))
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype="float32")
        M = cv2.getPerspectiveTransform(rect, dst)
        warp = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        return warp

    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect

    def extract_cells(self, grid_image: np.ndarray) -> List[np.ndarray]:
        cells = []
        h, w = grid_image.shape[:2]
        cell_h = h // 9
        cell_w = w // 9
        for i in range(9):
            for j in range(9):
                y1 = i * cell_h
                y2 = (i + 1) * cell_h
                x1 = j * cell_w
                x2 = (j + 1) * cell_w
                cell = grid_image[y1:y2, x1:x2]
                cells.append(cell)
        return cells

    def postprocess_board(self, board: List[List[int]]) -> List[List[int]]:
        cleaned = [row[:] for row in board]
        for i in range(9):
            seen = set()
            for j in range(9):
                val = cleaned[i][j]
                if val == 0:
                    continue
                if val in seen:
                    cleaned[i][j] = 0
                else:
                    seen.add(val)
        for j in range(9):
            seen = set()
            for i in range(9):
                val = cleaned[i][j]
                if val == 0:
                    continue
                if val in seen:
                    cleaned[i][j] = 0
                else:
                    seen.add(val)
        for box_row in range(0, 9, 3):
            for box_col in range(0, 9, 3):
                seen = set()
                for i in range(3):
                    for j in range(3):
                        r, c = box_row + i, box_col + j
                        val = cleaned[r][c]
                        if val == 0:
                            continue
                        if val in seen:
                            cleaned[r][c] = 0
                        else:
                            seen.add(val)
        return cleaned

    def recognize_digits(self, cells: List[np.ndarray], margin_ratio: float = 0.17, prefix: str = "", thresholding: str = "otsu", psm: int = 6, use_clahe: bool = False) -> List[List[int]]:
        board = []
        for i in range(9):
            row = []
            for j in range(9):
                idx = i * 9 + j
                cell_img = cells[idx]
                digit = 0
                h, w = cell_img.shape[:2]
                margin = int(min(h, w) * margin_ratio)
                cell_crop = cell_img[margin:h-margin, margin:w-margin]
                cell_proc = cv2.resize(cell_crop, (32, 32), interpolation=cv2.INTER_AREA)
                cell_proc = cv2.copyMakeBorder(cell_proc, 8, 8, 8, 8, cv2.BORDER_CONSTANT, value=0)
                if use_clahe:
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                    cell_proc = clahe.apply(cell_proc)
                if thresholding == "adaptive_mean":
                    cell_proc = cv2.adaptiveThreshold(cell_proc, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 2)
                elif thresholding == "adaptive_gaussian":
                    cell_proc = cv2.adaptiveThreshold(cell_proc, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
                else:
                    _, cell_proc = cv2.threshold(cell_proc, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                config = f'--psm {psm} -c tessedit_char_whitelist=123456789'
                text = pytesseract.image_to_string(cell_proc, config=config, lang='eng')
                text = text.strip()
                if text.isdigit() and len(text) == 1:
                    digit = int(text)
                row.append(digit)
            board.append(row)
        board = self.postprocess_board(board)
        return board 