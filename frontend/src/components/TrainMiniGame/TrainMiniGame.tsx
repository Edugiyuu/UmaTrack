import React, { useState, useEffect, useCallback } from "react";
import "./TrainMiniGame.css";
import confetti from "canvas-confetti";
import { PlayAudio } from "../../utils/PlayAudio";
import CountUp from "../ui/CountUp/CountUp";
import { useHorse } from "../../hooks/ContextHorse";


interface TrainMiniGameProps {
    show: boolean;
    onClose: () => void;
    onComplete: (rewards: {
        speed: number;
        stamina: number;
        power: number;
        wit: number;
    }) => void;
    trainType: "speed" | "stamina" | "power" | "wit";
    maxPoints?: number;
}

const TrainMiniGame: React.FC<TrainMiniGameProps> = ({ show, onClose, onComplete, trainType, maxPoints = 3, }) => {
    const [score, setScore] = useState(0);
    const [circleSize, setCircleSize] = useState(200);
    const [gameActive, setGameActive] = useState(false);
    const [randomPosition, setRandomPosition] = useState(Math.floor(Math.random() * 80) + 20);
    const [randomSpeed, setRandomSpeed] = useState(Math.floor(Math.random() * 5) + 6);
    const [randomSize, setRandomSize] = useState(Math.floor(Math.random() * 150) + 200);
    const [showResults, setShowResults] = useState(false);
    const { horse } = useHorse();
    
    const startGame = () => {
        setScore(0);
        setCircleSize(200);
        setGameActive(true);
        setShowResults(false);
    };

    const endGame = () => {
        setGameActive(false);
        setShowResults(true);
    };

    // Faz a bolinha ir fechando
    useEffect(() => {
        if (!gameActive) return;
        if (score >= maxPoints) {
            endGame();
            return;
        }

        let size = randomSize;
        const interval = setInterval(() => {
            size -= randomSpeed; // velocidade de encolher
            if (size <= 20) {
                clearInterval(interval);
                // se não acertar até o fim, errou
                if (score <= 0) {
                    endGame();
                } else {
                    setScore(score - 1);
                }

                setCircleSize(200); // reseta para próxima
                setRandomPosition(Math.floor(Math.random() * 80) + 20); // novo número aleatório

            } else {
                setCircleSize(size);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [gameActive, score]);

    // Quando o player aperta E
    const handleKeyPress = useCallback(
        (e: KeyboardEvent) => {
            if (!gameActive) return;
            if (e.key.toLowerCase() === "e") {
                // Verifica se a bolinha está "perto" do tamanho alvo
                if (circleSize >= 80 && circleSize <= 110) {
                    setScore((s) => s + 1);
                    confetti({
                        particleCount: 10,
                        spread: 150,
                        origin: { y: 0.7 },
                        zIndex: 9999,
                        scalar: 1.4,
                        shapes: ['star'],
                        colors: ["#34ef31ff"]
                    });
                    PlayAudio(`../../audios/correct2.wav`, 0.8);
                    setRandomPosition(Math.floor(Math.random() * 80) + 20);
                    setCircleSize(200);
                    setRandomSpeed(Math.floor(Math.random() * 5) + 6);
                    setRandomSize(Math.floor(Math.random() * 150) + 200); // novo tamanho aleatório
                } else {
                    setScore((s) => s - 1);
                    PlayAudio(`../../audios/incorrect.wav`, 0.8);
                    setRandomPosition(Math.floor(Math.random() * 80) + 20);
                    setRandomSpeed(Math.floor(Math.random() * 5) + 6);
                    setRandomSize(Math.floor(Math.random() * 150) + 200); // novo tamanho aleatório

                }
            }
        },
        [circleSize, gameActive]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    if (!show) return null;

    return (
        <div className="TrainMiniGameBackground" >
            <div className="TrainMiniGame" >
                {!gameActive && !showResults && (
                    <div>
                        <h2>Train {trainType}</h2>
                        <p>Press <b>E</b> on the right timing</p>
                        <button onClick={startGame}>Start</button>
                        <button onClick={onClose}>Cancel</button>
                    </div>
                )}
                {gameActive && (
                    <div className="game-area">


                        <div className="qte-container">
                            <h2>Score: {score}/{maxPoints}</h2>
                            <div className="circle-target"
                                style={{
                                    top: `${randomPosition}%`,
                                    left: `${randomPosition}%`,
                                }}
                            >E
                            </div>
                            <div
                                className="circle-moving"
                                style={{
                                    width: `${circleSize}px`,
                                    height: `${circleSize}px`,
                                    top: `${randomPosition}%`,
                                    left: `${randomPosition}%`,
                                }}
                            >
                            </div>

                        </div>
                        <div className="train-gif-container">
                            <img
                                src={`/horses/NiceNature/Profile2.gif`}
                                typeof='image/gif'
                                className='train-gif'
                            />
                        </div>

                    </div>
                )}
                {showResults && (
                    <div className="result-screen">
                        <h2>Treino concluído!</h2>
                        <p>Final score: <CountUp
                            from={0}
                            to={score}
                            separator=","
                            direction="up"
                            duration={2}
                            className="count-up-text"
                        /> pontos!</p>
                        <div>
                            <p>{horse?.speed}</p>
                            <p>{horse?.power}</p>
                            <p>{horse?.stamina}</p>
                            <p>{horse?.wit}</p>
                        </div>
                        <button onClick={() => {
                            const rewards = { speed: 0, stamina: 0, power: 0, wit: 0 };
                            rewards[trainType] = Math.min(score, maxPoints);
                            onComplete(rewards);
                            setShowResults(false);
                        }}>
                            OK
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TrainMiniGame;