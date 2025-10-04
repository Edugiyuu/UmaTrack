import React, { useState, useEffect, useCallback } from "react";
import "./TrainMiniGame.css";
import confetti from "canvas-confetti";

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
    const [randomNumber, setRandomNumber] = useState(Math.floor(Math.random() * 100));
    const startGame = () => {
        setScore(0);
        setCircleSize(200);
        setGameActive(true);
    };

    const endGame = () => {
        setGameActive(false);
        const rewards = { speed: 0, stamina: 0, power: 0, wit: 0 };
        rewards[trainType] = Math.min(score, maxPoints);
        onComplete(rewards);
    };

    // Faz a bolinha ir fechando
    useEffect(() => {
        if (!gameActive) return;
        if (score >= maxPoints) {
            endGame();
            return;
        }

        let size = 250;
        const interval = setInterval(() => {
            size -= 7; // velocidade de encolher
            if (size <= 20) {
                clearInterval(interval);
                // se não acertar até o fim, errou
                if (score <= 0) {
                    endGame();
                } else {
                    setScore(score - 1);
                }

                setCircleSize(200); // reseta para próxima
                setRandomNumber(Math.floor(Math.random() * 100)); // novo número aleatório
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
                    setRandomNumber(Math.floor(Math.random() * 100));
                    setCircleSize(200); // reseta para próxima tentativa
                } else {
                    setScore((s) => s - 1);
                    setRandomNumber(Math.floor(Math.random() * 100));
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
        <div className="TrainMiniGameBackground" onClick={onClose}>
            <div className="TrainMiniGame" onClick={(e) => e.stopPropagation()}>
                {!gameActive ? (
                    <div>
                        <h2>Train {trainType}</h2>
                        <p>Pressione <b>E</b> quando a bolinha pequena alinhar com a grande!</p>
                        <button onClick={startGame}>Start</button>
                        <button onClick={onClose}>Cancel</button>
                    </div>
                ) : (
                    <div className="qte-container">
                        <h2>Score: {score}/{maxPoints}</h2>
                        <div className="circle-target"
                            style={{
                                top: `${randomNumber}%`,
                                bottom: `${randomNumber}%`,
                                left: `${randomNumber}%`,
                            }}
                        >E</div>
                        <div
                            className="circle-moving"
                            style={{
                                width: `${circleSize}px`,
                                height: `${circleSize}px`,
                                top: `${randomNumber}%`,
                                bottom: `${randomNumber}%`,
                                left: `${randomNumber}%`,
                            }}
                        ></div>
                        <p>Pressione <b>E</b> no momento certo!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainMiniGame;