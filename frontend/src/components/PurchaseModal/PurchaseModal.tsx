import './PurchaseModal.css';
import type { HorseResponseProfile } from '../../types/horse';
import { horseColors } from '../HorseSelectorSelect/HorseSelectorSelect';
import Marquee from "react-fast-marquee"

interface Props {
    horse: HorseResponseProfile;
    userMoney: number;
    onPurchase: () => void;
    onCancel: () => void;
}

const PurchaseModal = ({ horse, userMoney, onPurchase, onCancel }: Props) => {
    const canAfford = userMoney >= horse.cost;

    return (
        <div className="modal-overlay">
            <div className="purchase-modal">
                <div className='horse-preview-container' style={{ backgroundColor: horseColors[horse.name] }}>
                    <Marquee direction="right" speed={140} className='marquee'>
                        {horse.name}
                    </Marquee>

                    <img
                        src={`/horses/${horse.name.replace(/\s+/g, "")}/Profile1.gif`}
                        alt={horse.name}
                        className="horse-preview"
                    />
                </div>

                <h2>Buy <span className="horse-name" style={{ color: horseColors[horse.name] }}>{horse.name}</span>?</h2>


                <div className="horse-details">
                    <p><strong>Cost:</strong> ${horse.cost}</p>
                    <p><strong>Your balance:</strong> ${userMoney}</p>
                    <div className="stats">
                        <p>Speed: {horse.speed}</p>
                        <p>Stamina: {horse.stamina}</p>
                        <p>Power: {horse.power}</p>
                        <p>Wit: {horse.wit}</p>
                    </div>
                </div>
                <div className="modal-buttons">
                    <button
                        onClick={onPurchase}
                        disabled={!canAfford}
                        className={`buy-button ${!canAfford ? 'disabled' : ''}`}
                    >
                        {canAfford ? 'Buy' : 'Not enough monies..'}
                    </button>
                    <button onClick={onCancel} className="cancel-button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseModal;