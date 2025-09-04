import axios from 'axios'
import SelectorSelectMiniBox from '../SelectorSelectMiniBox/SelectorSelectMiniBox'
import PurchaseModal from '../PurchaseModal/PurchaseModal'
import './HorseSelectorSelect.css'
import { useState, useEffect } from 'react';
import CustomLink from '../../utils/CustomLink';
import { verifyToken } from '../../services/authToken';
import { getUser } from '../../services/User';
import type { HorseResponseProfile } from '../../types/horse';
import speedIcon from '../../assets/gameIcons/speedIcon.png';
import powerIcon from '../../assets/gameIcons/powerIcon.png';
import staminaIcon from '../../assets/gameIcons/staminaIcon.png';
import witIcon from '../../assets/gameIcons/witIcon.png';

export const horseColors: { [key: string]: string } = {
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

const HorseSelectorSelect = () => {
  const [horses, setHorses] = useState<HorseResponseProfile[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<HorseResponseProfile | null>(null);
  const [userId, setUserId] = useState<any>(null);
  const [userHorses, setUserHorses] = useState<HorseResponseProfile[]>([]);
  const [userMoney, setUserMoney] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [horseToPurchase, setHorseToPurchase] = useState<HorseResponseProfile | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const result = await verifyToken();

      if (!result.valid) {
        setShowPopup(true);
      }

      try {
        const response = await axios.get("http://localhost:3000/horse");
        setHorses(response.data);
        setUserId(result.user.id);
      } catch (error) {
        console.error("Erro ao buscar cavalos:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    const checkUserHorses = async () => {
      if (!userId) return;

      try {
        const getResult = await getUser(userId);
        setUserHorses(getResult.horses);
        setUserMoney(getResult.monies);
      } catch (error) {
        console.error("Erro ao buscar cavalos do usuário:", error);
      }
    };

    checkUserHorses();
  }, [userId]);

  const isHorseOwned = (horse: HorseResponseProfile) => {
    return userHorses.some(userHorse => userHorse.name === horse.name);
  };

  const handleHorseSelect = (horse: HorseResponseProfile) => {
    if (isHorseOwned(horse)) {
      setSelectedHorse(horse);
    } else {
      setHorseToPurchase(horse);
    }
  };

  const handlePurchaseHorse = async () => {
    if (!horseToPurchase || !userId) return;

    try {
      if (userMoney < horseToPurchase.cost) {
        alert("You dont have enough money to buy this horse");
        return;
      }

      await axios.post(`http://localhost:3000/user/${userId}/purchase-horse`, {
        horseId: horseToPurchase._id
      });

      setUserHorses([...userHorses, horseToPurchase]);
      setUserMoney(userMoney - horseToPurchase.cost);
      setSelectedHorse(horseToPurchase);
      setHorseToPurchase(null);

      alert("Cavalo comprado com sucesso!");

    } catch (error) {
      console.error("Erro ao comprar cavalo:", error);
    }
  };

  const handleCancelPurchase = () => {
    setHorseToPurchase(null);
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
          <div id="Speed">
            <img className='statIcon' src={speedIcon} />
            <p>Speed: </p>
            <p>{selectedHorse?.speed}</p>
          </div>
          <div id="Stamina">
            <img className='statIcon' src={staminaIcon} />
            <p>Stamina:</p>
            <p>{selectedHorse?.stamina}</p>
          </div>
          <div id="Power">
            <img className='statIcon' src={powerIcon} />
            <p>Power:</p>
            <p>{selectedHorse?.power}</p>
          </div>
          <div id="Wit">
            <img className='statIcon' src={witIcon} />
            <p>Wit:</p>
            <p>{selectedHorse?.wit}</p>
          </div>
        </div>

        <div className="CareerInfo">
          <CustomLink to="Career" title="START" className="StartCareer" />
        </div>
      </div>

      <div className="HorseSelectorSelectContent">
        {horses.map((horse) => {
          const owned = isHorseOwned(horse);
          return (
            <SelectorSelectMiniBox
              key={horse._id}
              horse={horse}
              isSelected={selectedHorse?._id === horse._id}
              isOwned={owned}
              onClick={() => handleHorseSelect(horse)}
            />
          );
        })}
      </div>

      {horseToPurchase && (
        <PurchaseModal
          horse={horseToPurchase}
          userMoney={userMoney}
          onPurchase={handlePurchaseHorse}
          onCancel={handleCancelPurchase}
        />
      )}
    </div>
  );
};

export default HorseSelectorSelect;