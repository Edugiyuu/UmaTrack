import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const TriggerScrollAnimation = () => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.homeCards h1', {
        opacity: 0,
        y: 30,
        scale: 0.5,
        filter: "blur(1px)",
    },
        {
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.7,
            opacity: 1,
            ease: "power4.out",

            scrollTrigger: {
                trigger: ".homeCards h1",   // Elemento que ativa a animação
                start: "top 90%",     // Quando 80% do viewport chega no topo do trigger
                toggleActions: "play none none reverse"
            }
        },
    );
};
/* 
 scrollTrigger: {
                    trigger: ".SelectMusic",
                    start: "top 60%",
                    end: "bottom bottom",
                    scrub: 1.8,
                }, */