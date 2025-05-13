import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SudokuBoard.css';
import Footer from './Footer';

const ANIMATION_DELAY = 40; // ms per cell for OCR animation
const SOLVE_ANIMATION_SPEED = 10; // ms per step for solve animation

const SudokuBoard = ({ isDarkMode, onDarkModeChange }) => {
    const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
    const [initialBoard, setInitialBoard] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [difficulty, setDifficulty] = useState('medium');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState({
        generate: false,
        solve: false,
        validate: false,
        upload: false
    });
    const [sourceMap, setSourceMap] = useState(Array(9).fill().map(() => Array(9).fill('empty')));
    const [originMap, setOriginMap] = useState(Array(9).fill().map(() => Array(9).fill('empty')));
    const fileInputRef = useRef(null);
    const boardRef = useRef(null);
    const [gameTimer, setGameTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showNumPad, setShowNumPad] = useState(false);
    const [errors, setErrors] = useState(Array(9).fill().map(() => Array(9).fill(false)));
    const [showConfetti, setShowConfetti] = useState(false);

    // Timer effect
    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setGameTimer(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, setGameTimer]);

    // Format timer
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Wrap checkForErrors in useCallback
    const checkForErrors = useCallback((newBoard) => {
        const newErrors = Array(9).fill().map(() => Array(9).fill(false));
        
        // Check rows
        for (let row = 0; row < 9; row++) {
            const nums = {};
            for (let col = 0; col < 9; col++) {
                const value = newBoard[row][col];
                if (value !== 0) {
                    if (nums[value]) {
                        newErrors[row][col] = true;
                        newErrors[row][nums[value] - 1] = true;
                    } else {
                        nums[value] = col + 1;
                    }
                }
            }
        }
        
        // Check columns
        for (let col = 0; col < 9; col++) {
            const nums = {};
            for (let row = 0; row < 9; row++) {
                const value = newBoard[row][col];
                if (value !== 0) {
                    if (nums[value]) {
                        newErrors[row][col] = true;
                        newErrors[nums[value] - 1][col] = true;
                    } else {
                        nums[value] = row + 1;
                    }
                }
            }
        }
        
        // Check 3x3 boxes
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const nums = {};
                for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                    for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                        const value = newBoard[row][col];
                        if (value !== 0) {
                            if (nums[value]) {
                                newErrors[row][col] = true;
                                const [prevRow, prevCol] = nums[value];
                                newErrors[prevRow][prevCol] = true;
                            } else {
                                nums[value] = [row, col];
                            }
                        }
                    }
                }
            }
        }

        setErrors(newErrors);
    }, []); // No dependencies needed as it only uses setErrors which is stable

    // Animate OCR digits after image upload
    const animateOCRBoard = (ocrBoard, ocrSourceMap) => {
        setBoard(Array(9).fill().map(() => Array(9).fill(0)));
        setSourceMap(Array(9).fill().map(() => Array(9).fill('empty')));
        setInitialBoard(null);
        let flatCells = [];
        for (let i = 0; i < 9; ++i) {
            for (let j = 0; j < 9; ++j) {
                if (ocrSourceMap[i][j] === 'ocr' && ocrBoard[i][j] !== 0) {
                    flatCells.push({ i, j, value: ocrBoard[i][j] });
                }
            }
        }
        // If there are no OCR digits, just set the board and return
        if (!flatCells.length) {
            setInitialBoard(ocrBoard.map(row => [...row]));
            setBoard(ocrBoard);
            setSourceMap(ocrSourceMap);
            return;
        }
        let idx = 0;
        function step() {
            // GUARD: If idx is out of bounds, finish animation
            if (idx >= flatCells.length || !flatCells[idx]) {
                setInitialBoard(ocrBoard.map(row => [...row]));
                setBoard(ocrBoard);
                setSourceMap(ocrSourceMap);
                return;
            }
            const { i, j, value } = flatCells[idx];
            setBoard(prev => {
                const next = prev.map(row => [...row]);
                next[i][j] = value;
                return next;
            });
            setSourceMap(prev => {
                const next = prev.map(row => [...row]);
                next[i][j] = 'ocr';
                return next;
            });
            idx++;
            setTimeout(step, ANIMATION_DELAY);
        }
        step();
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        onDarkModeChange(!isDarkMode);
    };

    // Start timer when new puzzle is generated
    const startTimer = () => {
        setGameTimer(0);
        setIsTimerRunning(true);
    };

    // Stop timer when puzzle is solved
    const stopTimer = () => {
        setIsTimerRunning(false);
    };

    // Modify generateNewPuzzle to start timer
    const generateNewPuzzle = async () => {
        setIsLoading(prev => ({ ...prev, generate: true }));
        setMessage('');
        setErrors(Array(9).fill().map(() => Array(9).fill(false)));
        startTimer();
        try {
            const response = await fetch(`http://localhost:8000/generate?difficulty=${difficulty}`);
            if (!response.ok) throw new Error('Failed to generate puzzle');
            const data = await response.json();
            setBoard(data.puzzle);
            setInitialBoard(data.puzzle.map(row => [...row]));
            setSourceMap(Array(9).fill().map(() => Array(9).fill('empty')));
            setOriginMap(Array(9).fill().map(() => Array(9).fill('empty')));
        } catch (error) {
            setMessage('Error generating puzzle: ' + error.message);
            stopTimer();
        } finally {
            setIsLoading(prev => ({ ...prev, generate: false }));
        }
    };

    // Modify solvePuzzle to stop timer
    const solvePuzzle = async () => {
        setIsLoading(prev => ({ ...prev, solve: true }));
        setMessage('');
        stopTimer();
        try {
            const response = await fetch('http://localhost:8000/solve?show_steps=true', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ board }),
            });
            if (!response.ok) throw new Error('Failed to solve puzzle');
            const data = await response.json();
            if (data.steps) {
                animateBacktracking(data.steps, data.board);
            } else {
                setBoard(data.board);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
        } catch (error) {
            setMessage('Error solving puzzle: ' + error.message);
        } finally {
            setIsLoading(prev => ({ ...prev, solve: false }));
        }
    };

    const validateBoard = async () => {
        setIsLoading(prev => ({ ...prev, validate: true }));
        setMessage('');
        checkForErrors(board);
        try {
            const response = await fetch('http://localhost:8000/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ board }),
            });
            if (!response.ok) throw new Error('Failed to validate board');
            const data = await response.json();
            if (data.is_valid) {
                setMessage('Board is valid! 🎉');
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            } else {
                setMessage('Board is invalid. Check for errors highlighted in red.');
            }
        } catch (error) {
            setMessage('Error validating board: ' + error.message);
        } finally {
            setIsLoading(prev => ({ ...prev, validate: false }));
        }
    };

    // Wrap moveSelection in useCallback
    const moveSelection = useCallback((direction) => {
        if (!selectedCell) {
            setSelectedCell({ row: 0, col: 0 });
            return;
        }
        const { row, col } = selectedCell;
        let newRow = row;
        let newCol = col;
        switch (direction) {
            case 'up': newRow = Math.max(0, row - 1); break;
            case 'down': newRow = Math.min(8, row + 1); break;
            case 'left': newCol = Math.max(0, col - 1); break;
            case 'right': newCol = Math.min(8, col + 1); break;
            default: return;
        }
        if (initialBoard && initialBoard[newRow][newCol] !== 0) {
            switch (direction) {
                case 'up': newRow = Math.max(0, newRow - 1); break;
                case 'down': newRow = Math.min(8, newRow + 1); break;
                case 'left': newCol = Math.max(0, newCol - 1); break;
                case 'right': newCol = Math.min(8, newCol + 1); break;
                default: break;
            }
        }
        setSelectedCell({ row: newRow, col: newCol });
    }, [selectedCell, initialBoard]); // Add dependencies that are used inside the callback

    const handleCellClick = (row, col) => {
        setSelectedCell({ row, col });
        if (window.innerWidth < 768) {
            setShowNumPad(true);
        }
    };

    const handleNumberInput = (num) => {
        if (!selectedCell) return;
        const { row, col } = selectedCell;
        
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = num;
        setBoard(newBoard);
        setSourceMap(prev => {
            const next = prev.map(r => [...r]);
            next[row][col] = 'user';
            return next;
        });
        checkForErrors(newBoard);
    };

    const handleKeyPress = useCallback((event) => {
        if (!selectedCell) {
            setSelectedCell({ row: 0, col: 0 });
            return;
        }
        const { row, col } = selectedCell;
        const newBoard = board.map(row => [...row]);
        switch (event.key) {
            case 'ArrowUp': event.preventDefault(); moveSelection('up'); break;
            case 'ArrowDown': event.preventDefault(); moveSelection('down'); break;
            case 'ArrowLeft': event.preventDefault(); moveSelection('left'); break;
            case 'ArrowRight': event.preventDefault(); moveSelection('right'); break;
            case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                newBoard[row][col] = parseInt(event.key);
                setBoard(newBoard);
                setSourceMap(prev => {
                    const next = prev.map(r => [...r]);
                    next[row][col] = 'user';
                    return next;
                });
                checkForErrors(newBoard);
                break;
            case 'Backspace': case 'Delete':
                newBoard[row][col] = 0;
                setBoard(newBoard);
                setSourceMap(prev => {
                    const next = prev.map(r => [...r]);
                    next[row][col] = 'empty';
                    return next;
                });
                checkForErrors(newBoard);
                break;
            default: break;
        }
    }, [selectedCell, board, moveSelection, checkForErrors]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsLoading(prev => ({ ...prev, upload: true }));
        setMessage('');
        startTimer();
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await fetch('http://localhost:8000/process-image', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to process image');
            const data = await response.json();
            if (data.board && data.source_map) {
                animateOCRBoard(data.board, data.source_map);
                setTimeout(() => {
                    setMessage('Image processed! Please review the recognized digits and fill in any missing numbers manually.');
                }, 1000);
            } else {
                setBoard(data.board);
                setInitialBoard(data.board.map(row => [...row]));
                setSourceMap(Array(9).fill().map(() => Array(9).fill('empty')));
            }
            setOriginMap(Array(9).fill().map(() => Array(9).fill('empty')));
            setErrors(Array(9).fill().map(() => Array(9).fill(false)));
        } catch (error) {
            setMessage('Error processing image: ' + error.message);
            stopTimer();
        } finally {
            setIsLoading(prev => ({ ...prev, upload: false }));
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Clear the board
    const clearBoard = () => {
        setBoard(Array(9).fill().map(() => Array(9).fill(0)));
        setInitialBoard(null);
        setSourceMap(Array(9).fill().map(() => Array(9).fill('empty')));
        setOriginMap(Array(9).fill().map(() => Array(9).fill('empty')));
        setSelectedCell(null);
        setMessage('Board cleared');
        setErrors(Array(9).fill().map(() => Array(9).fill(false)));
        setGameTimer(0);
        setIsTimerRunning(false);
        setShowNumPad(false);
    };

    // Animate backtracking steps with improved visualization
    const animateBacktracking = (steps, finalBoard) => {
        // Capture the initial state at the start of animation
        const initial = initialBoard ? initialBoard.map(row => [...row]) : board.map(row => [...row]);
        let origin = Array(9).fill().map(() => Array(9).fill('empty'));
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (initial[i][j] !== 0) origin[i][j] = 'question';
            }
        }
        setOriginMap(origin);

        let currentStep = 0;
        let tempBoard = board.map(row => [...row]);
        let tempOrigin = origin.map(row => [...row]);

        const animateStep = () => {
            if (currentStep >= steps.length) {
                // Animation complete, show final board and mark all solver-filled cells as 'answer'
                setBoard(finalBoard);
                let finalOrigin = tempOrigin.map(row => [...row]);
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        if (finalOrigin[i][j] !== 'question' && finalBoard[i][j] !== 0) {
                            finalOrigin[i][j] = 'answer';
                        }
                    }
                }
                setOriginMap(finalOrigin);
                setSelectedCell(null);
                setMessage('Here is the solved Sudoku puzzle! 🎉');
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
                return;
            }

            const step = steps[currentStep];
            tempBoard[step.row][step.col] = step.value;
            // Mark as 'answer' if it was not an initial cell and is now filled
            if (initial[step.row][step.col] === 0 && step.value !== 0) {
                tempOrigin[step.row][step.col] = 'answer';
            }
            setBoard(tempBoard.map(row => [...row]));
            setOriginMap(tempOrigin.map(row => [...row]));
            setSelectedCell({ row: step.row, col: step.col });

            currentStep++;
            setTimeout(animateStep, SOLVE_ANIMATION_SPEED);
        };

        animateStep();
    };

    // Scroll into view when selected cell changes on mobile
    useEffect(() => {
        if (selectedCell && boardRef.current) {
            const { row, col } = selectedCell;
            const cellElement = document.getElementById(`cell-${row}-${col}`);
            if (cellElement) {
                cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedCell]);

    return (
        <div className={`sudoku-app ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="app-header">
                <h1>Enhanced Sudoku Solver</h1>
                <div className="timer-display">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-value">{formatTime(gameTimer)}</span>
                </div>
                <button 
                    onClick={toggleDarkMode}
                    className="theme-toggle"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
            </div>

            <div className="sudoku-container">
                <div className="controls">
                    <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="difficulty-select"
                        disabled={isLoading.generate}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <button 
                        onClick={generateNewPuzzle} 
                        className="control-button"
                        disabled={isLoading.generate}
                    >
                        {isLoading.generate ? 'Generating...' : 'New Puzzle'}
                    </button>
                    <button 
                        onClick={solvePuzzle} 
                        className="control-button solve-button"
                        disabled={isLoading.solve}
                    >
                        {isLoading.solve ? 'Solving...' : 'Solve'}
                    </button>
                    <button 
                        onClick={validateBoard} 
                        className="control-button"
                        disabled={isLoading.validate}
                    >
                        {isLoading.validate ? 'Validating...' : 'Validate'}
                    </button>
                    <button onClick={clearBoard} className="control-button clear-button">Clear</button>
                    <div className="upload-container">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            className="file-input"
                            disabled={isLoading.upload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="control-button upload-button"
                            disabled={isLoading.upload}
                        >
                            {isLoading.upload ? 'Processing...' : 'Upload Image'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`message${message.includes('review the recognized digits') ? ' blink' : message.includes('Error') ? ' error' : ' success'}`}>
                        {message}
                    </div>
                )}

                <div className="board-wrapper">
                    <div className="board" ref={boardRef}>
                        {board.map((row, rowIndex) => (
                            <div key={rowIndex} className="row">
                                {row.map((cell, colIndex) => {
                                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                                    const isRowHighlight = selectedCell && selectedCell.row === rowIndex && !isSelected;
                                    const isColHighlight = selectedCell && selectedCell.col === colIndex && !isSelected;
                                    const isBoxHighlight = selectedCell && 
                                                    Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) && 
                                                    Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3) && 
                                                    !isSelected && !isRowHighlight && !isColHighlight;
                                    const cellSource = sourceMap[rowIndex][colIndex];
                                    const cellOrigin = originMap[rowIndex][colIndex];
                                    const hasError = errors[rowIndex][colIndex];
                                    const cellClass = `cell${isSelected ? ' selected' : ''}
                                                          ${isRowHighlight ? ' row-highlight' : ''}
                                                          ${isColHighlight ? ' col-highlight' : ''}
                                                          ${isBoxHighlight ? ' box-highlight' : ''}
                                                          ${cellOrigin === 'question' ? ' question-digit' : ''}
                                                          ${cellOrigin === 'answer' ? ' answer-digit' : ''}
                                                          ${cellSource === 'user' ? ' user-digit' : ''}
                                                          ${hasError ? ' error-cell' : ''}`;
                                    return (
                                        <div
                                            id={`cell-${rowIndex}-${colIndex}`}
                                            key={`${rowIndex}-${colIndex}`}
                                            className={cellClass}
                                            onClick={() => handleCellClick(rowIndex, colIndex)}
                                        >
                                            {cell !== 0 ? cell : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {showNumPad && (
                    <div className="numpad">
                        <div className="numpad-grid">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button 
                                    key={num} 
                                    className="numpad-button" 
                                    onClick={() => handleNumberInput(num)}
                                >
                                    {num}
                                </button>
                            ))}
                            <button 
                                className="numpad-button clear-button" 
                                onClick={() => handleNumberInput(0)}
                            >
                                Clear
                            </button>
                        </div>
                        <button 
                            className="numpad-close" 
                            onClick={() => setShowNumPad(false)}
                        >
                            Close
                        </button>
                    </div>
                )}
                
                {showConfetti && <div className="confetti-container">
                    {Array(50).fill().map((_, i) => (
                        <div 
                            key={i} 
                            className="confetti" 
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
                            }}
                        />
                    ))}
                </div>}
            </div>

            <Footer />
        </div>
    );
};

export default SudokuBoard;
