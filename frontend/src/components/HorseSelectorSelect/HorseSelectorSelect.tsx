import axios from 'axios'
import SelectorSelectMiniBox from '../SelectorSelectMiniBox/SelectorSelectMiniBox'
import './HorseSelectorSelect.css'
import { useState, useEffect } from 'react';
import CustomLink from '../../utils/CustomLink';
import { verifyToken } from '../../services/authToken';

const horseColors: { [key: string]: string } = {
  'Oguri Cap': '#b8b8b8ff',
  'Silence Suzuka': '#2ab26cff',
  'Special Week': '#d45ce4ff',
  'Gold Ship': '#ffd700',
  'Mejiro McQueen': '#800080',
  'El Condor Pasa': '#ff4500',
  'Daiwa Scarlet': '#ff0000',
  'Nice Nature': '#775f58ff',
  'Grass Wonder': '#3f8bc2ff',
  'Tokai Teio': '#4169e1',
  'Twin Turbo': '#ff8c00',
  'Vodka': '#8a2be2'
};

interface Horse {
  id: string;
  name: string;
  speed: number;
  stamina: number;
  power: number;
  wit: number;
  passiveBuff: string;
}

const HorseSelectorSelect = () => {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const result = await verifyToken();

      if (!result.valid) {
        setShowPopup(true);
      }

      try {
        const response = await axios.get("http://localhost:3000/horse");
        setHorses(response.data);
      } catch (error) {
        console.error("Erro ao buscar cavalos:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, []);

  const handleHorseSelect = (horse: Horse) => {
    setSelectedHorse(horse);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="HorseSelectorSelect">
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Warning</h2>
            <p>You need to log in to access this page..</p>
            <button onClick={() => (window.location.href = "/login")}>
              Go to Login
            </button>
          </div>
        </div>
      )}

      <div className="HorseInfoPanel">
        <div
          className="HorseGifBox"
          style={{
            backgroundColor: selectedHorse
              ? horseColors[selectedHorse.name] || "#24bb6d"
              : "#c2c2c2ff",
          }}
        >
          <div id="stylebox2"></div>
          {selectedHorse && (
            <img
              src={`/horses/${selectedHorse.name.replace(/\s+/g, "")}/Profile1.gif`}
              alt={selectedHorse.name}
            />
          )}
        </div>

        <div className="HorseStats">
          <h2>{selectedHorse?.name}</h2>
          <div><p id="Speed">Speed: </p><p>{selectedHorse?.speed}</p></div>
          <div><p id="Stamina">Stamina:</p><p>{selectedHorse?.stamina}</p></div>
          <div><p id="Power">Power:</p><p>{selectedHorse?.power}</p></div>
          <div><p id="Wit">Wit:</p><p>{selectedHorse?.wit}</p></div>
        </div>

        <div className="CareerInfo">
          <CustomLink to="Career" title="START" className="StartCareer" />
        </div>
      </div>

      <div className="HorseSelectorSelectContent">
        {horses.map((horse) => (
          <SelectorSelectMiniBox
            key={horse.id}
            horse={horse}
            isSelected={selectedHorse?.id === horse.id}
            onClick={() => handleHorseSelect(horse)}
          />
        ))}
      </div>
    </div>
  );
};

export default HorseSelectorSelect;
