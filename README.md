# Sudoku Solver 🎯

A full-stack web application that solves Sudoku puzzles with advanced features including OCR (Optical Character Recognition) for puzzle input, real-time validation, and interactive solving animations.

## Features ✨

- **Interactive Sudoku Board**
  - Real-time validation
  - Error highlighting
  - Mobile-responsive design
  - Dark/Light mode support
  - Game timer

- **OCR Capabilities**
  - Upload images of Sudoku puzzles
  - Automatic digit recognition
  - Edit recognized digits
  - Support for various image formats

- **Puzzle Generation**
  - Multiple difficulty levels (Easy, Medium, Hard)
  - Unique solution guarantee
  - Balanced puzzle generation

- **Solving Features**
  - Step-by-step solving animation
  - Backtracking visualization
  - Solution validation
  - Error detection

- **Modern UI/UX**
  - Clean, intuitive interface
  - Smooth animations
  - Responsive design
  - Dark/Light theme
  - Mobile-friendly numpad

## Tech Stack 🛠️

### Frontend
- React.js
- CSS3 with modern features
- Font Awesome icons
- Responsive design principles

### Backend
- FastAPI (Python)
- OpenCV for image processing
- Tesseract OCR for digit recognition
- NumPy for numerical operations

## Getting Started 🚀

### Prerequisites
- Python 3.8+
- Node.js 14+
- Tesseract OCR
- OpenCV dependencies

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mnakum940/sudoku-solver.git
cd sudoku-solver
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Start the development servers:

Backend:
```bash
cd backend
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Usage 📝

1. **Generate a New Puzzle**
   - Select difficulty level
   - Click "New Puzzle"

2. **Upload an Image**
   - Click "Upload Image"
   - Select a clear image of a Sudoku puzzle
   - Review and edit recognized digits

3. **Solve Manually**
   - Click cells to select
   - Use keyboard or numpad to input numbers
   - Real-time validation will highlight errors

4. **Auto-Solve**
   - Click "Solve" to see the solution
   - Watch the step-by-step solving animation
   - Use "Validate" to check your progress

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact 📧

Manish Nakum - [@mnakum940](https://instagram.com/mnakum940)

Project Link: [https://github.com/mnakum940/sudoku-solver](https://github.com/mnakum940/sudoku-solver)

## Acknowledgments 🙏

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) for digit recognition
- [OpenCV](https://opencv.org/) for image processing
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Font Awesome](https://fontawesome.com/) for icons

---

Made with ❤️ by [Meet Nakum](https://github.com/mnakum940) 