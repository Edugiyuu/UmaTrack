import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { bgMusic, type MusicScene } from '../../services/bgMusic';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useHoverScale } from '../../animations/useHoverScale';
import './MusicToggle.css';

/** The route's music; screens opened on top of a route (training, skills) add their own. */
const sceneFor = (pathname: string): MusicScene => {
  if (/^\/Race\/[^/]+\/[^/]+/.test(pathname)) return 'race';
  if (/^\/Race\/[^/]+/.test(pathname)) return 'trackSelect';
  if (pathname.startsWith('/HorseSelector/Career/')) return 'career';
  return 'site';
};

/**
 * The music button, fixed in a corner of every screen (the career and race screens have
 * no header). The music only starts from this click, so the browser's autoplay rule is
 * never in the way. While it plays, three bars bounce with GSAP.
 */
const MusicToggle = () => {
  const { pathname } = useLocation();
  const on = useSyncExternalStore(bgMusic.subscribe, bgMusic.isEnabled);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    bgMusic.setBaseScene(sceneFor(pathname));
  }, [pathname]);

  useHoverScale(rootRef, '.MusicToggle__button', { hover: 1.08, press: 0.94 });

  useLayoutEffect(() => {
    const bars = barsRef.current ? Array.from(barsRef.current.children) : [];
    if (!on || reduced) {
      gsap.to(bars, { scaleY: on ? 0.7 : 0.25, duration: 0.25, ease: 'power2.out', overwrite: true });
      return;
    }
    const tweens = bars.map((bar, index) =>
      gsap.fromTo(
        bar,
        { scaleY: 0.25 },
        {
          scaleY: 1,
          duration: 0.32 + index * 0.09,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.11,
          overwrite: true
        }
      )
    );
    return () => tweens.forEach((tween) => tween.kill());
  }, [on, reduced]);

  const label = on ? 'Desligar a música' : 'Tocar a música';

  return (
    <div className='MusicToggle' ref={rootRef}>
      <button
        type='button'
        className={on ? 'MusicToggle__button is-on' : 'MusicToggle__button'}
        aria-pressed={on}
        aria-label={label}
        title={label}
        onClick={() => bgMusic.setEnabled(!on)}
      >
        {on ? (
          <span className='MusicToggle__bars' ref={barsRef} aria-hidden='true'>
            <span />
            <span />
            <span />
          </span>
        ) : (
          <svg className='MusicToggle__icon' viewBox='0 0 24 24' aria-hidden='true'>
            <path d='M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z' />
          </svg>
        )}
        <span className='MusicToggle__text'>{on ? 'Música' : 'Play'}</span>
      </button>
    </div>
  );
};

export default MusicToggle;
