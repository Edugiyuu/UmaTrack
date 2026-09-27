import { goalLabel } from '../../constants/career';
import type { CareerView } from '../../types/horse';

interface CareerCalendarProps {
    career: CareerView;
    turnsLeft: number;
}

/**
 * Her career as a row of races (docs/tasks/17-horse-career.md): the ones run, with the
 * placement, the next one, and the ones still ahead, each with its goal.
 */
const CareerCalendar = ({ career, turnsLeft }: CareerCalendarProps) => (
    <ol className='CareerCalendar' aria-label='Calendário da carreira'>
        {career.races.map((race) => {
            const result = career.results.find((entry) => entry.raceIndex === race.index);
            const isNext = career.nextRace?.index === race.index;
            const state = result ? (result.passed ? 'passed' : 'failed') : isNext ? 'next' : 'ahead';
            return (
                <li key={race.index} className={`CareerCalendar__race is-${state}`}>
                    <span className='CareerCalendar__index'>{race.index + 1}</span>
                    {/* "Sapporo" for "Sapporo Sprint": the full name does not fit five in a row. */}
                    <span className='CareerCalendar__track' title={race.trackName}>
                        {race.trackName.split(' ')[0]}
                    </span>
                    <span className='CareerCalendar__meta'>
                        {result
                            ? `${result.placement}º · meta ${goalLabel(race.goal)} ${result.passed ? '✓' : '✗'}`
                            : isNext
                                ? `${turnsLeft > 0 ? `em ${turnsLeft} turnos` : 'hoje'} · ${goalLabel(race.goal)}`
                                : goalLabel(race.goal)}
                    </span>
                </li>
            );
        })}
    </ol>
);

export default CareerCalendar;
