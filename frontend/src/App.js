import React, { useState, useEffect } from 'react';
import './App.css';
import SudokuBoard from './components/SudokuBoard';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for system dark mode preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update body class when dark mode changes
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="App-header">
        <h1>Sudoku Solver</h1>
      </header>
      <main>
        <SudokuBoard isDarkMode={isDarkMode} onDarkModeChange={setIsDarkMode} />
      </main>
    </div>
  );
}

export default App;
