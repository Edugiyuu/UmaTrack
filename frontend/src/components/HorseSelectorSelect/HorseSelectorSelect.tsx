import SelectorSelectMiniBox from '../SelectorSelectMiniBox/SelectorSelectMiniBox'
import PurchaseModal from '../PurchaseModal/PurchaseModal'
import './HorseSelectorSelect.css'
import { useState, useEffect } from 'react';
import CustomLink from '../../utils/CustomLink';
import { verifyToken } from '../../services/authToken';
import { getCurrentUser, purchaseHorse } from '../../services/User';
import { getAllHorses } from '../../services/Horse';
import { horseColors } from '../../constants/horseColors';
import type { HorseResponseProfile } from '../../types/horse';
import speedIcon from '../../assets/gameIcons/speedIcon.png';
import powerIcon from '../../assets/gameIcons/powerIcon.png';
import staminaIcon from '../../assets/gameIcons/staminaIcon.png';
import witIcon from '../../assets/gameIcons/witIcon.png';
import confetti from 'canvas-confetti';


const HorseSelectorSelect = () => {
  const [horses, setHorses] = useState<HorseResponseProfile[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<HorseResponseProfile | null>(null);
  const [userHorses, setUserHorses] = useState<HorseResponseProfile[]>([]);
  const [userMoney, setUserMoney] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [horseToPurchase, setHorseToPurchase] = useState<HorseResponseProfile | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      const result = await verifyToken();

      if (!result.valid) {
        if (!cancelled) {
          setShowPopup(true);
          setLoading(false);
        }
        return;
      }

      try {
        const [horseCatalog, user] = await Promise.all([
          getAllHorses(),
          getCurrentUser()
        ]);
        if (!cancelled) {
          setHorses(horseCatalog);
          setUserHorses(user.horses);
          setUserMoney(user.monies);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar seletor de cavalos:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPage();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!horseToPurchase || purchasing) return;

    try {
      setPurchasing(true);
      if (userMoney < horseToPurchase.cost) {
        alert("You dont have enough money to buy this horse");
        return;
      }
      const buyHorse = await purchaseHorse(horseToPurchase._id);

      if (buyHorse) {
        setUserHorses(buyHorse.user.horses);
        setUserMoney(buyHorse.user.monies);
        setSelectedHorse(horseToPurchase);
        setHorseToPurchase(null);
        confetti({
                particleCount: 400,
                spread: 240,
                origin: { y: 0.6 },
                zIndex: 9999,
                scalar: 1.7
              });
      }

    } catch (error) {
      console.error("Erro ao comprar cavalo:", error);
    } finally {
      setPurchasing(false);
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
          {selectedHorse && (
            <CustomLink to={`/HorseSelector/Career/${selectedHorse._id}`} title="START" className="StartCareer" />
          )}
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
          isPurchasing={purchasing}
        />
      )}
    </div>
  );
};

export default HorseSelectorSelect;