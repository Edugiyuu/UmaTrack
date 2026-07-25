import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import './CareerMenu.css'
import TrainMiniGame from '../TrainMiniGame/TrainMiniGame';
import { getOwnedHorse, trainHorse, type TrainType } from '../../services/User';
import { horseColors } from '../../constants/horseColors';
import type { HorseResponseProfile } from '../../types/horse';


const CareerMenu = () => {
    const { horseId } = useParams();
    const [horse, setHorse] = useState<HorseResponseProfile | null>(null);
    const [training, setTraining] = useState<boolean>(false);
    const [currentTrainType, setCurrentTrainType] = useState<TrainType>('speed');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                if (!horseId) return;
                const response = await getOwnedHorse(horseId);
                if (!cancelled) {
                    setHorse(response);
                    setError(null);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(error instanceof Error ? error.message : 'Could not load this horse.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [horseId]);

    const startTraining = (trainType: TrainType) => {
        if (!horse || (horse.turnsLeft ?? 0) <= 0 || training) return;
        setCurrentTrainType(trainType);
        setTraining(true);
    };

    const handleTrainingComplete = async (rewards: Record<TrainType, number>) => {
        if (!horseId) return;
        try {
            const updatedHorse = await trainHorse(horseId, currentTrainType, rewards[currentTrainType]);
            setHorse(updatedHorse);
            setError(null);
            setTraining(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not save training.';
            setError(message);
            throw error;
        }
    };

    if (loading) return <p>Loading career...</p>;
    if (error && !horse) return <p>{error}</p>;
    if (!horse) return <p>Horse not found.</p>;

    return (
        <div className='careerModeMenu'>
            <p id='horseNameTitle'>{horse?.name}</p>
            <div className='walking-gif-container'
            style={{
                        backgroundColor: horse.name
                          ? horseColors[horse.name] || "#24bb6d"
                          : "#c2c2c2ff",
                      }}>
                <img
                src={`/horses/${horse.name.replace(/\s+/g, "")}/Profile2.gif`}
                alt={horse.name}
                className='walking-gif'
            />
            </div>
            
            <p>{horse?.passiveBuff}</p>
            <h3>Turns left: <b id='turnsLeft'>{horse.turnsLeft ?? 0}</b></h3>
            {error && <p role="alert">{error}</p>}

            <TrainMiniGame
                show={training}
                onClose={() => setTraining(false)}
                onComplete={handleTrainingComplete}
                trainType={currentTrainType}
                maxPoints={10} horse={horse}
            />

            <div className='statsToTrain'>
                <div className='statToTrain-container'>
                    <p className='speedTrain'>Speed: {horse?.speed || 0}</p>
                    <button disabled={(horse.turnsLeft ?? 0) <= 0} onClick={() => startTraining('speed')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='staminaTrain'>Stamina: {horse?.stamina || 0}</p>
                    <button disabled={(horse.turnsLeft ?? 0) <= 0} onClick={() => startTraining('stamina')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='powerTrain'>Power: {horse?.power || 0}</p>
                    <button disabled={(horse.turnsLeft ?? 0) <= 0} onClick={() => startTraining('power')}>Train</button>
                </div>
                <div className='statToTrain-container'>
                    <p className='witTrain'>Wit: {horse?.wit || 0}</p>
                    <button disabled={(horse.turnsLeft ?? 0) <= 0} onClick={() => startTraining('wit')}>Train</button>
                </div>
            </div>
        </div>
    );
}

export default CareerMenu