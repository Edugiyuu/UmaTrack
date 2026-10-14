import './headerTop.css'
import CustomLink from '../../utils/CustomLink'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { verifyToken, logoutUser } from '../../services/authToken';
import { useHoverScale } from '../../animations/useHoverScale';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const LINKS = [
  { to: '/', title: 'Home', id: 'Home' },
  { to: '/Horses', title: 'Horses', id: 'Horses' },
  { to: '/Skills', title: 'Skills', id: 'Skills' },
  { to: '/Guide', title: 'Guide', id: 'Guide' },
  { to: '/HorseSelector', title: 'Play', id: 'Play' }
];

/** Width the underline is drawn at; GSAP stretches it with scaleX to fit each link. */
const UNDERLINE_WIDTH = 100;

const isActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

/**
 * Where the underline was on the last page. Every page mounts its own header, so this
 * outlives it and the underline can glide from the old link to the new one.
 */
let lastUnderline: { x: number; scaleX: number } | null = null;

/**
 * The site's top bar, v2 (Figma: the nav of "HorsesScreen v2" and the other catalogue
 * frames): the UmaTrack wordmark, the page links and the account corner. One green
 * underline marks the current page; GSAP slides it to the link under the pointer and
 * back, and from the previous page's link when a page opens.
 */
const HeaderTop = () => {
  const [username, setUsername] = useState<string | null>(null);
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  /** Read once per page, so a second effect run (StrictMode) still starts from the old link. */
  const startRef = useRef(lastUnderline);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const result = await verifyToken();

        if (result.valid && result.user) {
          setUsername(result.user.userName);
        } else {
          logoutUser();
          setUsername(null);
        }
      } catch {
        logoutUser();
        setUsername(null);
      }
    };

    checkToken();
  }, [])

  useHoverScale(rootRef, '.header__button, .header__brand', { hover: 1.05 });

  const activeLink = useCallback(() => {
    const index = LINKS.findIndex(({ to }) => isActive(pathname, to));
    return index < 0 ? null : navRef.current?.querySelectorAll<HTMLElement>('.header__link')[index] ?? null;
  }, [pathname]);

  /** Slides the underline under `link`, or fades it out when there is none. */
  const moveTo = useCallback(
    (link: HTMLElement | null, animate = true) => {
      const underline = underlineRef.current;
      if (!underline) return;
      if (!link) {
        gsap.to(underline, { autoAlpha: 0, duration: animate && !reduced ? 0.2 : 0, overwrite: true });
        return;
      }
      const target = { x: link.offsetLeft, scaleX: link.offsetWidth / UNDERLINE_WIDTH };
      lastUnderline = target;
      if (!animate || reduced) {
        gsap.set(underline, { ...target, autoAlpha: 1, overwrite: true });
        return;
      }
      gsap.to(underline, { ...target, autoAlpha: 1, duration: 0.35, ease: 'power3.out', overwrite: true });
    },
    [reduced]
  );

  // On a new page: start where the last page left the underline, then glide.
  useLayoutEffect(() => {
    const underline = underlineRef.current;
    if (!underline) return;
    const link = activeLink();
    const start = startRef.current;
    if (start && link && !reduced) {
      gsap.set(underline, { ...start, autoAlpha: 1 });
      moveTo(link);
    } else {
      moveTo(link, false);
    }
    return () => {
      gsap.killTweensOf(underline);
    };
  }, [activeLink, moveTo, reduced]);

  useEffect(() => {
    const onResize = () => moveTo(activeLink(), false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeLink, moveTo]);

  return (
    <header className='header' ref={rootRef}>
      <span className='header__brand' aria-label='UmaTrack'>
        Uma<span>Track</span>
      </span>

      <nav
        className='header__nav'
        ref={navRef}
        aria-label='Principal'
        onPointerOver={(event) => {
          const link = (event.target as Element).closest<HTMLElement>('.header__link');
          if (link) moveTo(link);
        }}
        onPointerLeave={() => moveTo(activeLink())}
      >
        {LINKS.map(({ to, title, id }) => (
          <CustomLink
            key={to}
            to={to}
            title={title}
            id={id}
            className={isActive(pathname, to) ? 'header__link is-current' : 'header__link'}
          />
        ))}
        <span ref={underlineRef} className='header__underline' aria-hidden='true' />
      </nav>

      <div className='header__account'>
        {username ? (
          <>
            <span className='header__user'>
              <span className='header__avatar' aria-hidden='true'>{username.charAt(0).toUpperCase()}</span>
              <CustomLink className='header__username' to='/UserProfile' title={username} />
            </span>
            <button
              type='button'
              onClick={() => {
                logoutUser();
                setUsername(null);
              }}
              className='header__button header__button--ghost'
            >
              Logout
            </button>
          </>
        ) : (
          <CustomLink to='/Login' title='Login' className='header__button' id='Login' />
        )}
      </div>
    </header>
  )
}

export default HeaderTop
