import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const TriggerScrollAnimation = () => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.shineSectionTitle', {
        opacity: 0,
        width: "0%",
        filter: "blur(1px)",
    },
        {
            width: "100%",
            filter: "blur(0px)",
            duration: 0.7,
            opacity: 1,
            ease: "power4.out",
            scrollTrigger: {
                trigger: ".shineSectionTitle",
                start: "top 100%",
                
                once: true,
            }
        },
    );
};