import React, { useState } from 'react';
import './CreateLoginInput.css';
import CustomLink from '../../utils/CustomLink';
import { createUser, LoginUser } from '../../services/User';
import { useNavigate } from 'react-router-dom';
import SnackBar from '../SnackBar/SnackBar';
import PopUp from '../PopUp/popUp';

interface CreateLoginInputProps {
  isLogin?: boolean;
}

const CreateLoginInput: React.FC<CreateLoginInputProps> = ({ isLogin = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginSucess, setLoginSucess] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [createSucess, setCreateSucess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({ email, username, password });
      setCreateSucess(true);
      
      setTimeout(() => {
      navigate('/Login');
    }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setCreateError(true);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LoginUser({ email, password });
      setLoginSucess(true);
    } catch (error) {
      if (error instanceof Error) {
        setLoginSucess(false);
      }
    }
  };

  return (
    <div className='CreateLoginInput'>
      <PopUp messageTitle={'Welcome back!'} onClose={function (){navigate('/');}} show={loginSucess} ></PopUp>
      {isLogin && (
        <div className='side-form'>
          <h2>Login</h2>
        </div>
      )}
      {!isLogin && (
        <div className='side-form'>
          <h2>Create Account</h2>
          <SnackBar
            errorAlert={createError}
            setErrorAlert={setCreateError}
            sucessAlert={createSucess}
            setSucessAlert={setCreateSucess}
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
