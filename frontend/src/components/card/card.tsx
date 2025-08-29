import { TriggerScrollAnimation } from './animations';
import { useEffect } from 'react'
import './card.css'

type CardProps = {
  horseName: string
  jpName: string
}
const formatHorseName = (name: string) => {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const Card = ({ horseName, jpName }: CardProps) => {
  useEffect(() => {
    TriggerScrollAnimation();
  }, [])
  
  return (
    <div className='card'>
      <div className='cardContent'>
        <h2 className={`horseName ${horseName}`}>{formatHorseName(horseName)}</h2>
        <img className='horseImg' src={`/horses/${horseName}/card${horseName}.png`}/>
        <h2 className='jpName'>{jpName}</h2>
      </div>
        
    </div>
  )
}

export default Card;