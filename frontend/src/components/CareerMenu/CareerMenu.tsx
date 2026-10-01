import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom';
import './CareerMenu.css'
import TrainMiniGame from '../TrainMiniGame/TrainMiniGame';
import SkillsScreen from '../SkillsScreen/SkillsScreen';
import RestScreen from '../RestScreen/RestScreen';
import VerticalName from '../ui/VerticalName/VerticalName';
import { useTransitionNavigate } from '../PageTransition/PageTransition';
import CareerCalendar from './CareerCalendar';
import StatCard from './StatCard';
import {
    getOwnedHorse,
    restHorse,
    startNewCareer,
    trainHorse,
    type RestOutcome,
    type TrainType,
    type TrainingOutcome
} from '../../services/User';
import { useScreenEnter } from '../../animations/screen';
import { useBarTween } from '../../animations/useBarTween';
import { useCountUp } from '../../animations/useCountUp';
import { useHoverScale } from '../../animations/useHoverScale';
import { horseColors } from '../../constants/horseColors';
import { goalLabel } from '../../constants/career';
import type { HorseResponseProfile } from '../../types/horse';
import { horseAsset, horseFolder, withImageFallback } from '../../utils/horseImage';
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

const STAT_CARDS: { stat: TrainType; label: string; icon: string }[] = [
    { stat: 'speed', label: 'Speed', icon: speedIcon },
    { stat: 'stamina', label: 'Stamina', icon: staminaIcon },
    { stat: 'power', label: 'Power', icon: powerIcon },
    { stat: 'wit', label: 'Wit', icon: witIcon }
];

const formatFans = (fans: number) => Math.round(fans).toLocaleString('pt-BR');

/** The GIFs of the screens opened from here are heavy (up to 6 MB): fetch them early. */
const preloadArt = (name: string) => {
    for (const file of ['Rest1.gif', 'Skills1.gif', 'Run1.gif']) {
        new Image().src = horseAsset(name, file);
    }
};

const CareerMenu = () => {
    const { horseId } = useParams();
    const go = useTransitionNavigate();
    const rootRef = useRef<HTMLDivElement>(null);
    const [horse, setHorse] = useState<HorseResponseProfile | null>(null);
    /**
     * What this screen keeps showing while a screen on top of it (the minigame, the rest
     * or the skills) already has the new numbers, so they animate once it closes.
     */
    const [frozen, setFrozen] = useState<HorseResponseProfile | null>(null);
    const [training, setTraining] = useState<boolean>(false);
    const [currentTrainType, setCurrentTrainType] = useState<TrainType>('speed');
    const [loading, setLoading] = useState(true);
    const [resting, setResting] = useState(false);
    const [rested, setRested] = useState<{ energyBefore: number; rest: RestOutcome } | null>(null);
    const [showSkills, setShowSkills] = useState(false);
    const [startingCareer, setStartingCareer] = useState(false);
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
                    preloadArt(response.name);
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

    const view = frozen ?? horse;
    const turnsLeft = view?.turnsLeft ?? 0;
    const energy = view?.energy ?? 0;

    useScreenEnter(rootRef, view !== null);
    useHoverScale(rootRef, '.StatCard__train, .Career__ghost, .Career__race');
    const energyBarRef = useBarTween<HTMLSpanElement>(energy / 100, { duration: 0.9 });
    const energyRef = useCountUp<HTMLSpanElement>(energy, { duration: 0.9 });
    const skillPointsRef = useCountUp<HTMLElement>(view?.skillPoints ?? 0);
    const fansRef = useCountUp<HTMLElement>(view?.fans ?? 0, { format: formatFans });

    const startTraining = (trainType: TrainType) => {
        if (!horse || (horse.turnsLeft ?? 0) <= 0 || training) return;
        setCurrentTrainType(trainType);
        setNotice(null);
        setFrozen(horse);
        setTraining(true);
    };

    const closeTraining = () => {
        setTraining(false);
        setFrozen(null);
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

    /** The rest screen opens over this one with the result; the bar here fills on close. */
    const handleRest = async () => {
        if (!horseId || !horse || resting || (horse.energy ?? 0) >= 100) return;
        try {
            setResting(true);
            setError(null);
            setNotice(null);
            const { horse: updatedHorse, rest } = await restHorse(horseId);
            setFrozen(horse);
            setHorse(updatedHorse);
            setRested({ energyBefore: horse.energy ?? 0, rest });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not rest.');
        } finally {
            setResting(false);
        }
    };

    const closeRest = () => {
        setRested(null);
        setFrozen(null);
    };

    const openSkills = () => {
        setFrozen(horse);
        setShowSkills(true);
    };

    const closeSkills = () => {
        setShowSkills(false);
        setFrozen(null);
    };

    /** A new career with the same girl: the retired copy stays in the profile. */
    const handleNewCareer = async () => {
        if (!horseId || startingCareer) return;
        try {
            setStartingCareer(true);
            setError(null);
            setHorse(await startNewCareer(horseId));
            setShowSkills(false);
            setFrozen(null);
            setNotice('Nova carreira! Ela voltou aos atributos iniciais; a anterior ficou no seu perfil.');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not start a new career.');
        } finally {
            setStartingCareer(false);
        }
    };

    if (loading) return <p className='Career__state'>Carregando a carreira...</p>;
    if (error && !horse) return <p className='Career__state' role='alert'>{error}</p>;
    if (!horse || !view) return <p className='Career__state'>Cavalo não encontrado.</p>;

    const horseColor = horseColors[horse.name] ?? 'var(--brand-red)';
    const canRace = energy >= RACE_ENERGY_COST;
    const career = view.career;
    const retired = career !== undefined && career.status !== 'active';
    const nextRace = career?.nextRace ?? null;
    const raceDue = career?.raceDue ?? false;
    const trainingRisky = energy < TRAINING_RISK_ENERGY;
    const art = withImageFallback(horse.name, [
        `${horseFolder(horse.name)}1.png`,
        'Profile2.gif',
        'Profile1.gif'
    ]);

    return (
        <div
            ref={rootRef}
            className='Career'
            style={{ '--horse-color': horseColor } as CSSProperties}
        >
            <section className='Career__hero' aria-hidden='true'>
                <div className='Career__wedge' data-screen='wedge' />
                <VerticalName name={horse.name} />
                <img {...art} alt='' className='Career__art' data-screen='art' />
            </section>

            <main className='Career__content'>
                <header className='Career__header' data-screen='item'>
                    <div className='Career__identity'>
                        <span className='Career__kicker'>Carreira · Treino</span>
                        <h1 className='Career__name'>{horse.name}</h1>
                        {view.passiveBuff && (
                            <p className='Career__passive'>
                                <span>Passiva</span> {view.passiveBuff}
                            </p>
                        )}
                    </div>

                    <div className={`Career__turns${raceDue ? ' is-due' : ''}${retired ? ' is-retired' : ''}`}>
                        {retired ? (
                            <>
                                <span className='Career__turns-label'>
                                    {career.status === 'completed' ? 'Carreira completa' : 'Carreira encerrada'}
                                </span>
                                <strong className='Career__turns-track'>
                                    {career.status === 'completed' ? 'Aposentada com honra' : 'Aposentada'}
                                </strong>
                                <span className='Career__turns-hint'>{career.results.length} provas da carreira</span>
                            </>
                        ) : nextRace ? (
                            <>
                                <span className='Career__turns-label'>
                                    {raceDue ? 'Hoje é dia de corrida' : 'Próxima prova'}
                                </span>
                                <strong className='Career__turns-track'>{nextRace.trackName}</strong>
                                <span className='Career__turns-hint'>
                                    {raceDue ? '' : `em ${turnsLeft} turnos · `}meta: {goalLabel(nextRace.goal)}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className='Career__turns-label'>Turnos restantes</span>
                                <strong className='Career__turns-value'>{turnsLeft}</strong>
                            </>
                        )}
                    </div>
                </header>

                <section className='Career__status' aria-label='Condição' data-screen='item'>
                    <div className='Career__cell Career__cell--energy'>
                        <span className='Career__cell-label'>Energia</span>
                        <div className='Career__energy'>
                            <div
                                className='Career__energy-bar'
                                role='progressbar'
                                aria-label='Energia'
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={energy}
                            >
                                <span ref={energyBarRef} />
                            </div>
                            <strong><span ref={energyRef} />/100</strong>
                        </div>
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Skill pts</span>
                        <strong ref={skillPointsRef} />
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Fãs</span>
                        <strong ref={fansRef} />
                    </div>
                    <div className='Career__cell'>
                        <span className='Career__cell-label'>Vitórias</span>
                        <strong>{view.racesWon ?? 0} / {view.racesRun ?? 0}</strong>
                    </div>
                </section>

                {career && (
                    <div data-screen='item'>
                        <CareerCalendar career={career} turnsLeft={turnsLeft} />
                    </div>
                )}

                {notice && <p className='Career__notice' role='status'>{notice}</p>}
                {error && <p className='Career__error' role='alert'>{error}</p>}

                <section className='Career__stats' aria-label='Atributos'>
                    {STAT_CARDS.map(({ stat, label, icon }) => (
                        <StatCard
                            key={stat}
                            stat={stat}
                            label={label}
                            icon={icon}
                            value={view[stat] || 0}
                            retired={retired}
                            turnsLeft={turnsLeft}
                            trainingRisky={trainingRisky}
                            trainingCost={TRAINING_ENERGY_COST}
                            onTrain={() => startTraining(stat)}
                        />
                    ))}
                </section>

                <div className='Career__actions' data-screen='item'>
                    {retired ? (
                        <button
                            type='button'
                            className='Career__race'
                            onClick={handleNewCareer}
                            disabled={startingCareer}
                        >
                            {startingCareer ? 'Começando...' : 'Nova carreira'}
                            <span>ela volta aos atributos iniciais · esta fica no seu perfil</span>
                        </button>
                    ) : (
                        <>
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
                                aria-haspopup='dialog'
                                onClick={openSkills}
                            >
                                Skills
                                <span>{view.skillPoints ?? 0} pts disponíveis</span>
                            </button>
                            {/* START RACE! lives on the track screen; this one only leads there. */}
                            <button
                                type='button'
                                className='Career__race'
                                onClick={() => go(`/Race/${horseId}`, { color: horseColor })}
                                disabled={!canRace}
                            >
                                {raceDue && nextRace ? 'Ir para a prova' : 'Escolher pista'}
                                <span>
                                    {!canRace
                                        ? `precisa de ${RACE_ENERGY_COST} de energia${raceDue ? ': descanse (grátis agora)' : ''}`
                                        : raceDue && nextRace
                                            ? `${nextRace.trackName} · sem inscrição · −${RACE_ENERGY_COST} energia`
                                            : `prova avulsa · −${RACE_ENERGY_COST} energia · 1 turno`}
                                </span>
                            </button>
                        </>
                    )}
                </div>

            </main>

            {rested && (
                <RestScreen
                    horse={horse}
                    energyBefore={rested.energyBefore}
                    rest={rested.rest}
                    onContinue={closeRest}
                />
            )}

            {showSkills && horseId && (
                <SkillsScreen
                    horse={horse}
                    horseId={horseId}
                    onHorseUpdated={setHorse}
                    onClose={closeSkills}
                />
            )}

            <TrainMiniGame
                show={training}
                onClose={closeTraining}
                onComplete={handleTrainingComplete}
                trainType={currentTrainType}
                maxPoints={MINIGAME_MAX_SCORE} horse={horse}
            />
        </div>
    )
}

export default CareerMenu
