import { useEffect, useState } from 'react'
import { getOneHorse } from '../../services/Horse';
import { useParams } from 'react-router-dom';
import './CareerMenu.css'
import TrainMiniGame from '../TrainMiniGame/TrainMiniGame';
import { horseColors } from '../HorseSelectorSelect/HorseSelectorSelect';


const CareerMenu = () => {
    const { horseId } = useParams();
    const [data, setData] = useState<any>();
    const [training, setTraining] = useState<boolean>(false);
    const [turnsLeft, setTurnsLeft] = useState<number>(5);
    const [currentTrainType, setCurrentTrainType] = useState<'speed' | 'stamina' | 'power' | 'wit'>('speed');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getOneHorse(horseId!);
                setData(response);
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

        setData((prev: any) => ({
            ...prev,
            speed: prev.speed + rewards.speed,
            stamina: prev.stamina + rewards.stamina,
            power: prev.power + rewards.power,
            wit: prev.wit + rewards.wit
        }));

        setTraining(false);

    };

    return (
        <div className='careerModeMenu'>
            <p>{data?.name}</p>
            <div className='walking-gif-container'
            style={{
                        backgroundColor: data?.name
                          ? horseColors[data?.name] || "#24bb6d"
                          : "#c2c2c2ff",
                      }}>
                <img
                src={`/horses/NiceNature/Profile2.gif`}
                typeof='image/gif'
                className='walking-gif'
            />
            </div>
            
            <p>{data?.passiveBuff}</p>
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
                    <p className='speedTrain'>Speed: {data?.speed || 0}</p>
                    <button onClick={() => startTraining('speed')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='staminaTrain'>Stamina: {data?.stamina || 0}</p>
                    <button onClick={() => startTraining('stamina')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='powerTrain'>Power: {data?.power || 0}</p>
                    <button onClick={() => startTraining('power')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='witTrain'>Wit: {data?.wit || 0}</p>
                    <button onClick={() => startTraining('wit')}>Train</button>
                </div>
            </div>
        </div>
    );
}

export default CareerMenu