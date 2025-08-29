import { NavLink, useNavigate } from 'react-router-dom';
import { type MouseEvent, useEffect } from 'react';
import { gsap } from 'gsap';
/* import { PlayAudio } from './PlayAudio'; */

interface CustomLinkProps {
  to: string;
  title:string;
  id?:string;
  className?:string;
}

const CustomLink = ({ to, title, className,id }: CustomLinkProps) => {
    const navigate = useNavigate();
    useEffect(() => {
        if (!document.getElementById('transition')) {
            const transitionScreen = document.createElement('div');
            transitionScreen.id = 'transition';
            
            transitionScreen.style.position = 'fixed';
            transitionScreen.style.top = '0';
            transitionScreen.style.left = '100%';
            transitionScreen.style.width = '100%';
            transitionScreen.style.height = '100%';
            transitionScreen.style.backgroundColor = '#f1f1f1ff';
            transitionScreen.style.zIndex = '10';
            
            document.body.appendChild(transitionScreen);
        }
    }, []);

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        /* PlayAudio(`${import.meta.env.BASE_URL}/audios/UI/P4Select.wav`,0.8); */
        const screen = document.getElementById('transition');
        
        if (screen) {
            gsap.timeline().to(screen, {
                left: '0%',
                duration: 0.4,
                ease: "power2.inOut"
            })
            // Navega pra próxima página
            .call(() => {
                navigate(to);
            })
            .to(screen, {
                left: '-100%',
                duration: 0.5,
                ease: "power2.inOut"
            })
            .set(screen, {
                left: '100%'
            });
        }
    };

    return (
        <NavLink to={to} className={className} onClick={handleClick} id={id}>
            {title}
        </NavLink>
    );
};

export default CustomLink;