import HeroSection from '../components/homeHeroSection/heroSection'
import HeaderTop from '../components/headerTop/headerTop'
import HomeCards from '../components/homeCards/homeCards'
import ShineSection from '../components/homeShineSection/shineSection'
/* import Credits from '../components/credits/credits' */

const Home = () => {
  return (
    <div style={{overflowX: 'hidden'}}>
        <HeaderTop />
        <HeroSection></HeroSection>
        <HomeCards></HomeCards>
        <ShineSection></ShineSection>
        {/* <Credits></Credits> */}
    </div>
  )
}

export default Home