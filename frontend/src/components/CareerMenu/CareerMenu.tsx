import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import './CareerMenu.css'
import TrainMiniGame from '../TrainMiniGame/TrainMiniGame';
import SkillPanel from '../SkillPanel/SkillPanel';
import {
    getOwnedHorse,
    restHorse,
    trainHorse,
    type TrainType,
    type TrainingOutcome
} from '../../services/User';
import { horseColors } from '../../constants/horseColors';
import type { HorseResponseProfile } from '../../types/horse';
import { horseAnimation } from '../../utils/horseImage';

/** Mirrors TRAINING_ENERGY_COST and RACE_ENERGY_COST on the server. */
const TRAINING_ENERGY_COST = 20;
const RACE_ENERGY_COST = 35;
const MINIGAME_MAX_SCORE = 10;

const STAT_ROWS: { stat: TrainType; label: string; className: string }[] = [
    { stat: 'speed', label: 'Speed', className: 'speedTrain' },
    { stat: 'stamina', label: 'Stamina', className: 'staminaTrain' },
    { stat: 'power', label: 'Power', className: 'powerTrain' },
    { stat: 'wit', label: 'Wit', className: 'witTrain' }
];

const CareerMenu = () => {
    const { horseId } = useParams();
    const navigate = useNavigate();
    const [horse, setHorse] = useState<HorseResponseProfile | null>(null);
    const [training, setTraining] = useState<boolean>(false);
    const [currentTrainType, setCurrentTrainType] = useState<TrainType>('speed');
    const [loading, setLoading] = useState(true);
    const [resting, setResting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

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

    const turnsLeft = horse?.turnsLeft ?? 0;
    const energy = horse?.energy ?? 0;
    const mood = horse?.mood ?? 3;

    const startTraining = (trainType: TrainType) => {
        if (!horse || turnsLeft <= 0 || training) return;
        setCurrentTrainType(trainType);
        setNotice(null);
        setTraining(true);
    };

    /**
     * The minigame only reports how the player did; the server decides the reward and
     * hands back the outcome so the results screen can show what was actually gained.
     */
    const handleTrainingComplete = async (score: number): Promise<TrainingOutcome> => {
        if (!horseId) throw new Error('Cavalo inválido');
        try {
            const { horse: updatedHorse, training: outcome } = await trainHorse(
                horseId,
                currentTrainType,
                score,
                MINIGAME_MAX_SCORE
            );
            setHorse(updatedHorse);
            setError(null);
            return outcome;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not save training.';
            setError(message);
            throw error;
        }
    };

    const handleRest = async () => {
        if (!horseId || resting || turnsLeft <= 0) return;
        try {
            setResting(true);
            setError(null);
            const { horse: updatedHorse, rest } = await restHorse(horseId);
            setHorse(updatedHorse);
            setNotice(`Ela descansou: +${rest.energyRecovered} de energia.`);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not rest.');
        } finally {
            setResting(false);
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
                {...horseAnimation(horse.name, 'Profile2.gif')}
                alt={horse.name}
                className='walking-gif'
            />
            </div>

            <p>{horse?.passiveBuff}</p>
            <h3>Turns left: <b id='turnsLeft'>{turnsLeft}</b></h3>

            <div className='careerCondition'>
                <label className='careerCondition__meter'>
                    Energia
                    <progress max={100} value={energy} />
                    <span>{energy}/100</span>
                </label>
                <p>Humor: {"★".repeat(mood)}{"☆".repeat(Math.max(0, 5 - mood))}</p>
                <p>Skill points: <b>{horse.skillPoints ?? 0}</b></p>
                <p>Fãs: <b>{(horse.fans ?? 0).toLocaleString('pt-BR')}</b></p>
                <p>Corridas: <b>{horse.racesRun ?? 0}</b> · Vitórias: <b>{horse.racesWon ?? 0}</b></p>
            </div>

            {notice && <p className='careerNotice'>{notice}</p>}
            {error && <p role="alert" className='careerError'>{error}</p>}

            <TrainMiniGame
                show={training}
                onClose={() => setTraining(false)}
                onComplete={handleTrainingComplete}
                trainType={currentTrainType}
                maxPoints={MINIGAME_MAX_SCORE} horse={horse}
            />

            <div className='statsToTrain'>
                {STAT_ROWS.map(({ stat, label, className }) => (
                    <div className='statToTrain-container' key={stat}>
                        <p className={className}>{label}: {horse[stat] || 0}</p>
                        <button disabled={turnsLeft <= 0} onClick={() => startTraining(stat)}>Train</button>
                    </div>
                ))}
            </div>

            <div className='careerActions'>
                <button
                    type='button'
                    onClick={handleRest}
                    disabled={resting || turnsLeft <= 0 || energy >= 100}
                    title={`Gasta 1 turno e devolve energia. Treinar custa ${TRAINING_ENERGY_COST}.`}
                >
                    {resting ? 'Descansando...' : 'Descansar'}
                </button>
                <button
                    type='button'
                    className='careerActions__race'
                    onClick={() => navigate(`/Race/${horseId}`)}
                    disabled={energy < RACE_ENERGY_COST}
                    title={energy < RACE_ENERGY_COST ? `Precisa de ${RACE_ENERGY_COST} de energia` : undefined}
                >
                    Ir para as corridas
                </button>
            </div>

            {horseId && (
                <SkillPanel horse={horse} horseId={horseId} onHorseUpdated={setHorse} />
            )}
        </div>
    );
}

export default CareerMenu
