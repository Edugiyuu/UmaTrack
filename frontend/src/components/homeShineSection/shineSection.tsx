import './shineSection.css';
import UmaSkill from '../../assets/UmaSkill1.png'
import { useEffect } from 'react';
import { TriggerScrollAnimation } from './animations';


const ShineSection = () => {
    useEffect(() => {
      TriggerScrollAnimation();
    }, [])
  return (
    <div className='shineSection'>
      <div className='shineSectionTitle'>
        <h2>MAKE HER SHINE ON THE TRACK</h2>
      </div>

      <div className='shineSectionContent'>
        <div id='horseBox'>
          <img src={UmaSkill} className='floating-image' />
          <img src={UmaSkill} className='floating-image' />
          <img src={UmaSkill} className='floating-image' />
          <img src={UmaSkill} className='floating-image' />
          <img src={UmaSkill} className='floating-image' />
          <div id='stylebox'></div>
          <img src='horses/ElCondorPasa/ElCondorPasa1.png' className='CarouselHorseImage' />
        </div>

      

      </div>
    </div>
  )
}

export default ShineSection;