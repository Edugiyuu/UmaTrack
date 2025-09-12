import type { HorseResponseProfile } from '../../types/horse';
import './SelectorSelectMiniBox.css'

interface Props {
  horse: HorseResponseProfile;
  isSelected?: boolean;
  isOwned?: boolean;
  onClick?: () => void;
}

const SelectorSelectMiniBox = ({ horse, isSelected, isOwned = true, onClick }: Props) => {
  return (
    <div 
      className={`SelectorSelectMiniBox ${isSelected ? 'selected' : ''} ${!isOwned ? 'disabled' : ''}`}
      onClick={onClick}
      style={{ 
        opacity: isOwned ? 1 : 0.5,
        cursor: 'pointer'
      }}
    >
      <img 
        src={`/horses/${horse.name.replace(/\s+/g,"")}/Selection.png`} 
        id={horse.name}
        style={{ 
          filter: isOwned ? 'none' : 'grayscale(100%)' 
        }}
      />
      {!isOwned && (
        <div className="locked-overlay">
          🔒
        </div>
      )}
    </div>
  )
}

export default SelectorSelectMiniBox