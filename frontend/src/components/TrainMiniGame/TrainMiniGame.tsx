import React, { useState, useEffect } from 'react';
import './TrainMiniGame.css'

interface TrainMiniGameProps {
    show: boolean;
    onClose: () => void;
    onComplete: (rewards: { speed: number; stamina: number; power: number; wit: number }) => void;
    trainType: 'speed' | 'stamina' | 'power' | 'wit';
    maxPoints?: number;
}

const TrainMiniGame: React.FC<TrainMiniGameProps> = ({ show, onClose, onComplete, trainType, maxPoints = 10 }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [gameActive, setGameActive] = useState(false);

    const startGame = () => {
        setScore(0);
        setTimeLeft(10);
        setGameActive(true);
    };

    const endGame = () => {
        setGameActive(false);
        const rewards = { speed: 0, stamina: 0, power: 0, wit: 0 };
        rewards[trainType] = Math.min(score, maxPoints);
        onComplete(rewards);
    };

    const handleClick = () => {
        if (!gameActive) return;
        const newScore = score + 1;
        setScore(newScore);
        if (newScore >= maxPoints) {
            endGame();
        }
    };

    useEffect(() => {
        if (gameActive && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && gameActive) {
            endGame();
        }
    }, [gameActive, timeLeft]);

    if (!show) return null;

    return (
        <div className='TrainMiniGameBackground' onClick={onClose}>
            <div className='TrainMiniGame' onClick={(e) => e.stopPropagation()}>
                {!gameActive ? (
                    <div>
                        <h2>Train {trainType}</h2>
                        <img
                            src={`/horses/SilenceSuzuka/Train.gif`}
                            typeof='image/gif'
                            className='train-gif'
                        />
                        <p>Click the button as fast as you can!</p>
                        <p>Max points: {maxPoints}</p>
                        <button onClick={startGame}>Start</button>
                        <button onClick={onClose}>Cancel</button>
                    </div>
                ) : (
                    <div>
                        <h2>Training {trainType}!</h2>
                        <p>Time: {timeLeft}s</p>
                        <p>Score: {score}/{maxPoints}</p>
                        <button className='click-button' onClick={handleClick}>
                            TRAIN
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainMiniGame;