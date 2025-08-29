import { useEffect } from 'react'
import CustomLink from '../../utils/CustomLink'
import Card from '../card/card'
import '../homeCards/homeCards.css'
import { TriggerScrollAnimation } from './animations'

const HomeCards = () => {
  useEffect(() => {
    TriggerScrollAnimation()
  }, [])

  return (
    <div className="homeCards">
      <h1>BE A TRAINER</h1>
      <div className='cardsContainer'>
        <Card horseName="SilenceSuzuka" jpName='サイレンススズカ'></Card>
        <Card horseName="ElCondorPasa" jpName='エルコンドルパサ'></Card>
        <Card horseName="OguriCap" jpName='オグリキャップ'></Card>
      </div>
      <CustomLink to="/Login" title="START!" className="StartButon" />
    </div>
  )
}

export default HomeCards