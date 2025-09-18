import { useEffect, useState } from 'react'
import { getOneHorse } from '../../services/Horse';
import { useParams } from 'react-router-dom';
import './CareerMenu.css'
import TrainMiniGame from '../TrainMiniGame/TrainMiniGame';


const CareerMenu = () => {
    const { horseId } = useParams();
    const [data, setData] = useState<any>(null);
    const [training, setTraining] = useState<boolean>(false);
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
            <p>{data?.passiveBuff}</p>
            <h3>Turns left: 3</h3>
            
            <TrainMiniGame 
                show={training} 
                onClose={() => setTraining(false)}
                onComplete={handleTrainingComplete}
                trainType={currentTrainType}
                maxPoints={10}
            />
            
            <div className='statsToTrain'>
                <div className='statToTrain-container'>
                    <p>Speed: {data?.speed || 0}</p>
                    <button onClick={() => startTraining('speed')}>Train Speed</button>
                </div>
                <div className='statToTrain-container'>
                    <p>Stamina: {data?.stamina || 0}</p>
                    <button onClick={() => startTraining('stamina')}>Train Stamina</button>
                </div>
                <div className='statToTrain-container'>
                    <p>Power: {data?.power || 0}</p>
                    <button onClick={() => startTraining('power')}>Train Power</button>
                </div>
                <div className='statToTrain-container'>
                    <p>Wit: {data?.wit || 0}</p>
                    <button onClick={() => startTraining('wit')}>Train Wit</button>
                </div>
            </div>
        </div>
    );
}

export default CareerMenu