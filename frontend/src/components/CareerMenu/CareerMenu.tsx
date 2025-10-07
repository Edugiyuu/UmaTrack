import { useEffect, useState } from 'react'
import { getOneHorse } from '../../services/Horse';
import { useParams } from 'react-router-dom';
import './CareerMenu.css'
import TrainMiniGame from '../TrainMiniGame/TrainMiniGame';
import { horseColors } from '../HorseSelectorSelect/HorseSelectorSelect';
import { useHorse } from '../../hooks/ContextHorse';


const CareerMenu = () => {
    const { horseId } = useParams();
    const { horse, setHorse } = useHorse();
    const [training, setTraining] = useState<boolean>(false);
    const [turnsLeft, setTurnsLeft] = useState<number>(5);
    const [currentTrainType, setCurrentTrainType] = useState<'speed' | 'stamina' | 'power' | 'wit'>('speed');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getOneHorse(horseId!);
                setHorse(response);
            } catch (error) {
                console.error(error);
            }
        };

        if (horseId) {
            fetchData();
        }
    }, [horseId]);

    const startTraining = (trainType: 'speed' | 'stamina' | 'power' | 'wit') => {
        setCurrentTrainType(trainType);
        setTraining(true);
        setTurnsLeft(turnsLeft - 1);
    };

    const handleTrainingComplete = (rewards: { speed: number; stamina: number; power: number; wit: number }) => {
        console.log('🎉 Recompensas do treinamento:', rewards);

        if (horse) {
            setHorse({
                ...horse,
                speed: horse.speed + rewards.speed,
                stamina: horse.stamina + rewards.stamina,
                power: horse.power + rewards.power,
                wit: horse.wit + rewards.wit
            });
        }

        setTraining(false);

    };

    return (
        <div className='careerModeMenu'>
            <p>{horse?.name}</p>
            <div className='walking-gif-container'
            style={{
                        backgroundColor: horse?.name
                          ? horseColors[horse?.name] || "#24bb6d"
                          : "#c2c2c2ff",
                      }}>
                <img
                src={`/horses/NiceNature/Profile2.gif`}
                typeof='image/gif'
                className='walking-gif'
            />
            </div>
            
            <p>{horse?.passiveBuff}</p>
            <h3>Turns left: {turnsLeft}</h3>

            <TrainMiniGame
                show={training}
                onClose={() => setTraining(false)}
                onComplete={handleTrainingComplete}
                trainType={currentTrainType}
                maxPoints={10}
            />

            <div className='statsToTrain'>
                <div className='statToTrain-container'>
                    <p className='speedTrain'>Speed: {horse?.speed || 0}</p>
                    <button onClick={() => startTraining('speed')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='staminaTrain'>Stamina: {horse?.stamina || 0}</p>
                    <button onClick={() => startTraining('stamina')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='powerTrain'>Power: {horse?.power || 0}</p>
                    <button onClick={() => startTraining('power')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='witTrain'>Wit: {horse?.wit || 0}</p>
                    <button onClick={() => startTraining('wit')}>Train</button>
                </div>
            </div>
        </div>
    );
}

export default CareerMenu