import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useBarTween } from '../../animations/useBarTween';
import { useCountUp } from '../../animations/useCountUp';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { statRank } from '../../constants/statRank';
import type { TrainType } from '../../services/User';

/** The grades from the bottom up, so a higher index is a better grade. */
const GRADE_ORDER = 'GFEDCBAS';

interface StatCardProps {
    stat: TrainType;
    label: string;
    icon: string;
    value: number;
    /** Hides the Treinar button once the career is over. */
    retired: boolean;
    turnsLeft: number;
    trainingRisky: boolean;
    trainingCost: number;
    onTrain: () => void;
}

/**
 * One stat on the training screen. After a session the value counts up, the grade bar
 * fills (wrapping round when the grade goes up) and a new grade letter pops (task 27).
 */
const StatCard = ({
    stat,
    label,
    icon,
    value,
    retired,
    turnsLeft,
    trainingRisky,
    trainingCost,
    onTrain
}: StatCardProps) => {
    const rank = statRank(value);
    const valueRef = useCountUp<HTMLElement>(value, { duration: 0.8 });
    const barRef = useBarTween<HTMLDivElement>(rank.progress, {
        duration: 0.8,
        lap: GRADE_ORDER.indexOf(rank.letter)
    });

    const letterRef = useRef<HTMLSpanElement>(null);
    const letterShown = useRef(rank.letter);
    const reduced = usePrefersReducedMotion();
    useLayoutEffect(() => {
        if (letterShown.current === rank.letter) return;
        letterShown.current = rank.letter;
        if (reduced || !letterRef.current) return;
        const tween = gsap.fromTo(
            letterRef.current,
            { scale: 1.7 },
            { scale: 1, duration: 0.5, ease: 'back.out(1.6)', delay: 0.4 }
        );
        return () => {
            tween.revert();
        };
    }, [rank.letter, reduced]);

    return (
        <article className={`StatCard StatCard--${stat}`} data-screen='item'>
            <header className='StatCard__head'>
                <img src={icon} alt='' />
                <h2>{label}</h2>
            </header>
            <div className='StatCard__body'>
                <span ref={letterRef} className='StatCard__rank' aria-label={`Nota ${rank.letter}`}>
                    {rank.letter}
                </span>
                <div className='StatCard__info'>
                    <strong ref={valueRef} className='StatCard__value' />
                    <div className='StatCard__progress' aria-hidden='true'>
                        <div ref={barRef} />
                    </div>
                    <span className='StatCard__next'>
                        {rank.toNext === null ? 'nota máxima' : `próxima nota em ${rank.toNext} pts`}
                    </span>
                </div>
            </div>
            {!retired && (
                <button
                    type='button'
                    className='StatCard__train'
                    disabled={turnsLeft <= 0}
                    onClick={onTrain}
                >
                    Treinar
                    <span className={trainingRisky && turnsLeft > 0 ? 'is-risky' : undefined}>
                        {turnsLeft <= 0
                            ? 'turnos acabaram'
                            : trainingRisky
                                ? 'risco de falhar'
                                : `−${trainingCost} energia`}
                    </span>
                </button>
            )}
        </article>
    );
};

export default StatCard;
