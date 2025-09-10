import React from 'react';
import "./PopUp.css";

interface PopUpProps {
  show: boolean;
  messageTitle: string;
  messageSubTitle?: string;
  imageUrl?: string;
  onClose: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ show, messageTitle, messageSubTitle, imageUrl, onClose }) => {
  if (!show) return null;

  return (
    <div className="popUpBackground">
      <div className="popUpContainer">
        {imageUrl && <img src={imageUrl} alt="PopUp" className="popUpImage" />}
        <h2 className="popUpTitle">{messageTitle}</h2>
        {messageSubTitle && <p className="popUpSubtitle">{messageSubTitle}</p>}
        <button className="popUpButton" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default PopUp;
