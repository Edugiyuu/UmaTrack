import { useEffect } from 'react';
import ca from '../../assets/carousel1.jpg'
import GradientText from '../ui/GradientText/GradientText'
import { TriggerTitles } from "./animations";
import './heroSection.css'

const HeroSection = () => {
  useEffect(() => {
    TriggerTitles();
  }, [])

  return (
    <div className='heroSection'>
      <img src={ca} className='heroSectionImg' />
      <div className='overlay' />
      <div className='heroSectionText'>
        <GradientText
          colors={["#ff40d2ff", "#d06ce9ff", "#ff40d2ff", "#d06ce9ff", "#db0eabff"]}
          animationSpeed={4}
          showBorder={false}
          className="titleText"
        >
          ✦ UMATRACK ✦
        </GradientText>
        <h1>ウマ娘</h1>

      </div>
    </div>
  )
}

export default HeroSection