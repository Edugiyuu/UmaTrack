import { createContext, useContext, useState } from 'react';
import type { HorseResponseProfile } from '../types/horse';

interface HorseContextType {
    horse: HorseResponseProfile | null;
    setHorse: (horse: HorseResponseProfile) => void;
}

const HorseContext = createContext<HorseContextType>({
    horse: null,
    setHorse: () => {}
});

export const useHorse = () => useContext(HorseContext);

export const HorseProvider = ({ children }: { children: any }) => {
    const [horse, setHorse] = useState<HorseResponseProfile | null>(null);

    return (
        <HorseContext.Provider value={{ horse, setHorse }}>
            {children}
        </HorseContext.Provider>
    );
};
