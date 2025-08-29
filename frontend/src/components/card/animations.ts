import { gsap } from "gsap";

export const TriggerScrollAnimation = () => {
    gsap.fromTo(".card",
        {   
            rotationY: -180,
            perspective: 900,

        },
        {
            rotationY: 0,
            perspective: 900,
         
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.2,
            scrollTrigger: {
                trigger: ".cardContent",
                start: "top 70%",
                end: "top 20%",
                toggleActions: "restart none none reverse",
                
            }
        }
    );
};
/* 
 scrollTrigger: {
                    trigger: ".SelectMusic",
                    start: "top 60%",
                    end: "bottom bottom",
                    scrub: 1.8,
                }, */