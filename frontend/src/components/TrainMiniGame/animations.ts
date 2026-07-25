import { gsap } from "gsap";

export const TriggerTitles = () => {
    gsap.fromTo('.titleText, .carouselTitle', {
        opacity: 0,
        y: 30,
        scale: 0.9,
        filter: "blur(1px)",
    },
        {
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            delay: 0.2,
            duration: 2,
            opacity: 1,
            ease: "power4.out",
            stagger: {
                amount: 0.4,
                from: "start",
                ease: "power2.in"
            }
        },
    );
};