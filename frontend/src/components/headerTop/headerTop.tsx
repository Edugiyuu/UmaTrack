import './headerTop.css'
import HorseLogo from '../../assets/horseLogo.png'
import CustomLink from '../../utils/CustomLink'
import Cookies from "universal-cookie";
import { useEffect, useState } from 'react';
import { verifyToken, logoutUser } from '../../services/authToken';

const cookies = new Cookies();

const HeaderTop = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<any>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const result = await verifyToken();
        
        
        if (result.valid && result.user) {
          setUsername(result.user.userName);
          setUserId(result.user.id)
          
        } else {
          cookies.remove("token");
          setUsername(null);
        }
      } catch (error) {
        cookies.remove("token");
        setUsername(null);
      }
    };

    checkToken();
  }, [])
  

  return (
    <div className='header'>
      <div className='headerContent'>
        <img src={HorseLogo} id='HorseLogo' />
        <CustomLink to="/" title="Home" className="headerLink" id="Home"/>
        <CustomLink to="/Horses" title="Horses" className="headerLink" id="Horses"/>
        <CustomLink to="/Skills" title="Skills" className="headerLink" id="Skills"/>
        <CustomLink to="/Guide" title="Guide" className="headerLink" id="Guide"/>
        <CustomLink to="/HorseSelector" title="Play" className="headerLink" id="Play"/>
      </div>
      <div className="headerLoginSection">
        {username ? (
          <>
            <CustomLink className="headerUsername" to={`/UserProfile/${userId}`} title={username}/>
            <button 
              onClick={() => {
                logoutUser();
                setUsername(null);
              }} 
              className="headerLink logoutButton"
            >
              Logout
            </button>
          </>
        ) : (
          <CustomLink to="/Login" title="Login" className="headerLink" id="Login"/>
        )}
      </div>
    </div>
  )
}

export default HeaderTop