import React, { useState, useEffect, useRef } from 'react';

const QuizGame = () => {
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(45);
    const [gameOver, setGameOver] = useState(false);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    const [endTime, setEndTime] = useState(null);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('quizState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            
            // Calculate remaining time based on stored endTime
            let remainingTime = 0;
            if (parsed.endTime && !parsed.gameOver) {
                const now = Date.now();
                remainingTime = Math.max(0, Math.ceil((parsed.endTime - now) / 1000));
            } else {
                remainingTime = parsed.timeLeft;
            }

            setQuizData(parsed.quizData);
            setCurrentQuestionIndex(parsed.currentQuestionIndex);
            setSelectedAnswers(parsed.selectedAnswers);
            setScore(parsed.score);
            setTimeLeft(remainingTime);
            setEndTime(parsed.endTime);
            setGameOver(parsed.gameOver);

            // If game was active and time remains, restart timer
            if (!parsed.gameOver && parsed.quizData && remainingTime > 0) {
                startTimer();
            } else if (!parsed.gameOver && parsed.quizData && remainingTime <= 0) {
                // Time expired while away
                setGameOver(true);
                setTimeLeft(0);
            }
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (quizData) {
            localStorage.setItem('quizState', JSON.stringify({
                quizData,
                currentQuestionIndex,
                selectedAnswers,
                score,
                timeLeft,
                endTime,
                gameOver
            }));
        }
    }, [quizData, currentQuestionIndex, selectedAnswers, score, timeLeft, endTime, gameOver]);

    const fetchQuiz = async () => {
        setLoading(true);
        setError(null);
        setGameOver(false);
        setScore(0);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setTimeLeft(45);
        setEndTime(null);
        
        // Clear previous state
        localStorage.removeItem('quizState');

        try {
            const response = await fetch('http://localhost:3000/api/quiz', {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch quiz');
            }
            const data = await response.json();
            setQuizData(data);
            
            // Set end time 45 seconds from now
            const calculatedEndTime = Date.now() + 45000;
            setEndTime(calculatedEndTime);
            
            startTimer();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const endGame = () => {
        clearInterval(timerRef.current);
        setGameOver(true);
        // calculateScore is called via useEffect when gameOver changes
    };

    const calculateScore = () => {
        if (!quizData) return;
        let newScore = 0;
        quizData.questions.forEach((q) => {
            if (selectedAnswers[q.id] === q.correct_answer) {
                newScore += 1;
            }
        });
        setScore(newScore);
    };

    const handleAnswerSelect = (questionId, option) => {
        if (gameOver) return;
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            endGame();
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Recalculate score whenever game ends to ensure latest state is used
    useEffect(() => {
        if (gameOver) {
            calculateScore();
        }
    }, [gameOver]);


    if (loading) {
        return <div className="loading-container">Generating Quiz...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p>Error: {error}</p>
                <button onClick={fetchQuiz} className="btn-primary">Try Again</button>
            </div>
        );
    }

    if (!quizData && !gameOver) {
        return (
            <div className="start-screen">
                <h1>Infinite Quiz AI</h1>
                <p>10 Questions. 45 Seconds. Prove your knowledge.</p>
                <button onClick={fetchQuiz} className="btn-primary">Take Quiz</button>
            </div>
        );
    }

    if (gameOver) {
        return (
            <div className="results-screen">
                <h2>Game Over</h2>
                <div className="score-display">
                    <span className="score-value">{score}</span>
                    <span className="score-total">/ {quizData?.questions?.length || 10}</span>
                </div>
                <p>Time Remaining: {timeLeft}s</p>
                <button onClick={fetchQuiz} className="btn-primary">Play Again</button>
                
                <div className="answers-review">
                    <h3>Review</h3>
                    {quizData?.questions.map((q, index) => (
                        <div key={q.id} className={`review-item ${selectedAnswers[q.id] === q.correct_answer ? 'correct' : 'incorrect'}`}>
                            <p><strong>Q{index + 1}:</strong> {q.question}</p>
                            <p>Your Answer: {selectedAnswers[q.id] || 'Skipped'}</p>
                            <p>Correct Answer: {q.correct_answer}</p>
                            <p className="explanation">{q.explanation}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];

    return (
        <div className="game-container">
            <div className="game-header">
                <div className="timer" style={{ color: timeLeft < 10 ? 'red' : 'inherit' }}>
                    Time: {timeLeft}s
                </div>
                <div className="progress">
                    Question {currentQuestionIndex + 1} / {quizData.questions.length}
                </div>
            </div>

            <div className="question-card">
                <div className="category-badge">{currentQuestion.category} - {currentQuestion.difficulty}</div>
                <h2 className="question-text">{currentQuestion.question}</h2>
                
                <div className="options-grid">
                    {currentQuestion.options.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx];
                        const isSelected = selectedAnswers[currentQuestion.id] === letter;
                        return (
                            <button 
                                key={letter} 
                                className={`option-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(currentQuestion.id, letter)}
                            >
                                <span className="option-letter">{letter}</span>
                                <span className="option-text">{opt}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="game-footer">
                <button 
                    className="btn-next" 
                    onClick={handleNext}
                >
                    {currentQuestionIndex === quizData.questions.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default QuizGame;
