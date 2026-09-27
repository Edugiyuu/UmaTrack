import { useEffect, useState, type CSSProperties } from 'react'
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
import { statRank } from '../../constants/statRank';
import type { HorseResponseProfile } from '../../types/horse';
import { horseFolder, withImageFallback } from '../../utils/horseImage';
import speedIcon from '../../assets/gameIcons/speedIcon.png';
import staminaIcon from '../../assets/gameIcons/staminaIcon.png';
import powerIcon from '../../assets/gameIcons/powerIcon.png';
import witIcon from '../../assets/gameIcons/WitIcon.png';

/** Mirrors TRAINING_ENERGY_COST and RACE_ENERGY_COST on the server. */
const TRAINING_ENERGY_COST = 20;
const RACE_ENERGY_COST = 35;
/** Below this the server may spoil the session (see resolveTraining). */
const TRAINING_RISK_ENERGY = 25;
const MINIGAME_MAX_SCORE = 10;
const MAX_MOOD = 5;

const STAT_CARDS: { stat: TrainType; label: string; icon: string }[] = [
    { stat: 'speed', label: 'Speed', icon: speedIcon },
    { stat: 'stamina', label: 'Stamina', icon: staminaIcon },
    { stat: 'power', label: 'Power', icon: powerIcon },
    { stat: 'wit', label: 'Wit', icon: witIcon }
];

const CareerMenu = () => {
    const { horseId } = useParams();
    const navigate = useNavigate();
    const [horse, setHorse] = useState<HorseResponseProfile | null>(null);
    const [training, setTraining] = useState<boolean>(false);
    const [currentTrainType, setCurrentTrainType] = useState<TrainType>('speed');
    const [loading, setLoading] = useState(true);
    const [resting, setResting] = useState(false);
    const [showSkills, setShowSkills] = useState(false);
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
    const mood = Math.min(MAX_MOOD, Math.max(0, horse?.mood ?? 3));

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
        if (!horseId || resting || energy >= 100) return;
        try {
            setResting(true);
            setError(null);
            const { horse: updatedHorse, rest } = await restHorse(horseId);
            setHorse(updatedHorse);
            setNotice(
                `Ela descansou: +${rest.energyRecovered} de energia.` +
                (rest.turnSpent ? '' : ' (sem turnos, o descanso saiu de graça)')
            );
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not rest.');
        } finally {
            setResting(false);
        }
    };

    if (loading) return <p className='Career__state'>Carregando a carreira...</p>;
    if (error && !horse) return <p className='Career__state' role='alert'>{error}</p>;
    if (!horse) return <p className='Career__state'>Cavalo não encontrado.</p>;

    const canRace = energy >= RACE_ENERGY_COST;
    const trainingRisky = energy < TRAINING_RISK_ENERGY;
    const art = withImageFallback(horse.name, [
        `${horseFolder(horse.name)}1.png`,
        'Profile2.gif',
        'Profile1.gif'
    ]);

    return (
        <div
            className='Career'
            style={{ '--horse-color': horseColors[horse.name] ?? 'var(--brand-red)' } as CSSProperties}
        >
            <section className='Career__hero' aria-hidden='true'>
                <div className='Career__wedge' />
                <img {...art} alt='' className='Career__art' />
            </section>

            <main className='Career__content'>
                <header className='Career__header'>
                    <div className='Career__identity'>
                        <span className='Career__kicker'>Carreira · Treino</span>
                        <h1 className='Career__name'>{horse.name}</h1>
                        {horse.passiveBuff && (
                            <p className='Career__passive'>
                                <span>Passiva</span> {horse.passiveBuff}
                            </p>
                        )}
                    </div>

                    <div className='Career__turns'>
                        <span className='Career__turns-label'>Turnos restantes</span>
                        <strong className='Career__turns-value'>{turnsLeft}</strong>
                        {turnsLeft <= 0 && (
                            <span className='Career__turns-hint'>descansar sai de graça</span>
                        )}
                    </div>
                </header>

                <section className='Career__status' aria-label='Condição'>
                    <div className='Career__cell Career__cell--energy'>
                        <span className='Career__cell-label'>Energia</span>
                        <div className='Career__energy'>
                            <progress
                                className='Career__energy-bar'
                                max={100}
                                value={energy}
                                aria-label='Energia'
                            />
                            <strong>{energy}/100</strong>
                        </div>
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Humor</span>
                        <strong className='Career__mood' aria-label={`Humor ${mood} de ${MAX_MOOD}`}>
                            {'★'.repeat(mood)}
                            <span>{'★'.repeat(MAX_MOOD - mood)}</span>
                        </strong>
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Skill pts</span>
                        <strong>{horse.skillPoints ?? 0}</strong>
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Fãs</span>
                        <strong>{(horse.fans ?? 0).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Vitórias</span>
                        <strong>{horse.racesWon ?? 0} / {horse.racesRun ?? 0}</strong>
                    </div>
                </section>

                {notice && <p className='Career__notice' role='status'>{notice}</p>}
                {error && <p className='Career__error' role='alert'>{error}</p>}

                <section className='Career__stats' aria-label='Atributos'>
                    {STAT_CARDS.map(({ stat, label, icon }) => {
                        const value = horse[stat] || 0;
                        const rank = statRank(value);
                        return (
                            <article className={`StatCard StatCard--${stat}`} key={stat}>
                                <header className='StatCard__head'>
                                    <img src={icon} alt='' />
                                    <h2>{label}</h2>
                                </header>
                                <div className='StatCard__body'>
                                    <span className='StatCard__rank' aria-label={`Nota ${rank.letter}`}>
                                        {rank.letter}
                                    </span>
                                    <div className='StatCard__info'>
                                        <strong className='StatCard__value'>{value}</strong>
                                        <div className='StatCard__progress' aria-hidden='true'>
                                            <div style={{ width: `${Math.round(rank.progress * 100)}%` }} />
                                        </div>
                                        <span className='StatCard__next'>
                                            {rank.toNext === null
                                                ? 'nota máxima'
                                                : `próxima nota em ${rank.toNext} pts`}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type='button'
                                    className='StatCard__train'
                                    disabled={turnsLeft <= 0}
                                    onClick={() => startTraining(stat)}
                                >
                                    Treinar
                                    <span className={trainingRisky ? 'is-risky' : undefined}>
                                        {trainingRisky ? 'risco de falhar' : `−${TRAINING_ENERGY_COST} energia`}
                                    </span>
                                </button>
                            </article>
                        );
                    })}
                </section>

                <div className='Career__actions'>
                    <button
                        type='button'
                        className='Career__ghost'
                        onClick={handleRest}
                        disabled={resting || energy >= 100}
                    >
                        {resting ? 'Descansando...' : 'Descansar'}
                        <span>{energy >= 100 ? 'energia cheia' : turnsLeft > 0 ? '+ energia · 1 turno' : '+ energia · grátis'}</span>
                    </button>
                    <button
                        type='button'
                        className='Career__ghost'
                        aria-expanded={showSkills}
                        onClick={() => setShowSkills((open) => !open)}
                    >
                        {showSkills ? 'Fechar skills' : 'Ver skills'}
                        <span>{horse.skillPoints ?? 0} pts disponíveis</span>
                    </button>
                    <button
                        type='button'
                        className='Career__race'
                        onClick={() => navigate(`/Race/${horseId}`)}
                        disabled={!canRace}
                    >
                        Start race!
                        <span>
                            {canRace
                                ? `−${RACE_ENERGY_COST} energia`
                                : `precisa de ${RACE_ENERGY_COST} de energia (faltam ${RACE_ENERGY_COST - energy})`}
                        </span>
                    </button>
                </div>

                {showSkills && horseId && (
                    <div className='Career__skills'>
                        <SkillPanel horse={horse} horseId={horseId} onHorseUpdated={setHorse} />
                    </div>
                )}
            </main>

            <TrainMiniGame
                show={training}
                onClose={() => setTraining(false)}
                onComplete={handleTrainingComplete}
                trainType={currentTrainType}
                maxPoints={MINIGAME_MAX_SCORE} horse={horse}
            />
        </div>
    )
}

export default CareerMenu
