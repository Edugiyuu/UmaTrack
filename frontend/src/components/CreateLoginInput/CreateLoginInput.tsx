import React, { useState } from 'react';
import './CreateLoginInput.css';
import CustomLink from '../../utils/CustomLink';
import { createUser, LoginUser } from '../../services/User';
import GrassWonderChibi from '/horses/GrassWonder/Chibi1.png'
import { useNavigate } from 'react-router-dom';
import confetti from "canvas-confetti";
import SnackBar from '../SnackBar/SnackBar';
import PopUp from '../PopUp/PopUp';

interface CreateLoginInputProps {
  isLogin?: boolean;
}

const CreateLoginInput: React.FC<CreateLoginInputProps> = ({ isLogin = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginSucess, setLoginSucess] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [createSucess, setCreateSucess] = useState(false);
  const [firstHorse, setFirstHorse] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      var result = await createUser({ email, username, password });
      setCreateSucess(true);
      console.log(result)
      console.log(result.user)
      console.log(result.user.horses)
      console.log(result.user.horses[0])
      setFirstHorse(result.user.horses[0].name)
      console.log("Primeiro horse:", firstHorse);

      confetti({
        particleCount: 250,
        spread: 180,
        origin: { y: 0.6 },
        zIndex: 9999,
        scalar: 1.2
      });
    } catch (error) {
      if (error instanceof Error) {
        setLoginSucess(false);
        setCreateError(true);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LoginUser({ email, password });
      setLoginSucess(true);
      confetti({
        particleCount: 250,
        spread: 180,
        origin: { y: 0.6 },
        zIndex: 9999,
        scalar: 1.2
      });
    } catch (error) {
      if (error instanceof Error) {
        setLoginSucess(false);
        setLoginError(true);
      }
    }
  };

  return (
    <div className='CreateLoginInput'>
      <PopUp messageTitle={'Welcome back!'} onClose={function () { navigate('/'); }} show={loginSucess} imageUrl={GrassWonderChibi}></PopUp>
      <PopUp messageTitle={'Created successfully!'} messageSubTitle={`You got ${firstHorse}!`} onClose={function () { navigate('/Login'); }} show={createSucess} imageUrl={GrassWonderChibi}></PopUp>

      {isLogin && (
        <div className='side-form'>
          <h2>Login</h2>
          <SnackBar
            errorAlert={loginError}
            setErrorAlert={setLoginError}
            sucessMessage="Logged in successfully"
            errorMessage="Error logging in.."
          />
        </div>
      )}
      {!isLogin && (
        <div className='side-form'>
          <h2>Create Account</h2>
          <SnackBar
            errorAlert={createError}
            setErrorAlert={setCreateError}
            sucessMessage="Created successfully"
            errorMessage="Error creating account"
          />
        </div>
      )}

      <div className="form-container">

        {!isLogin && (
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Type your user name"
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Type your email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Type your password"
          />
        </div>
        {isLogin && (
          <div className='final-form'>
            <button className='sendButton' onClick={handleLogin}>Login</button>
            <CustomLink className="formLink" to='/CreateAccount' title="Don't have an account?"></CustomLink>
          </div>
        )}
        {!isLogin && (
          <div className='final-form'>
            <button className='sendButton' onClick={handleRegister}>Create</button>
            <CustomLink className="formLink" to='/Login' title='Already have an account?'></CustomLink>
          </div>

        )}
      </div>

    </div>
  );
};

export default CreateLoginInput;
