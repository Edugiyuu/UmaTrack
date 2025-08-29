import './SelectorSelectMiniBox.css'

interface Horse {
  id: string;
  name: string;
  speed: number;
  stamina: number;
  power: number;
  wit: number;
  passiveBuff: string;
}

interface Props {
  horse: Horse;
  isSelected?: boolean;
  onClick?: () => void;
}

const SelectorSelectMiniBox = ({ horse, isSelected, onClick }: Props) => {
  return (
    <div 
      className={`SelectorSelectMiniBox ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <img src={`/horses/${horse.name.replace(/\s+/g,"")}/Selection.png`} id={horse.name} />
    </div>
  )
}

export default SelectorSelectMiniBox