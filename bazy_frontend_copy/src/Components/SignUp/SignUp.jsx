import React from 'react'
import './SignUp.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
          const res = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, login: null })
          })
          const data = await res.json()
    
          if (res.ok) {
            alert('Rejestracja zakończona sukcesem!')
            localStorage.setItem("token", data.access_token);
            navigate("/dashboard");
          } else {
            alert(data.detail || 'Błąd rejestracji.')
          }
    
        } catch (err) {
          alert('Błąd połączenia z serwerem.')
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    };
    
    return(
        <div className='container'>
            <div className='header'>
                <div className="avatar">
                    <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="text">Rejestracja</div>
            </div>
            <div className="inputs">
                <div className="input">
                    <FontAwesomeIcon icon={faUser} />
                    <input 
                        type="text" 
                        placeholder="Nazwa użytkownika" 
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />    
                </div>   
                <div className="input">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </div>
                <div className="input">
                    <FontAwesomeIcon icon={faLock} />
                    <input 
                        type="password" 
                        placeholder="Hasło" 
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </div>
            </div>
            <div className="submit-container">
                <div className="submit" onClick={handleRegister}>
                    Zarejestruj się
                </div>
                <div className="login-link">
                    Masz już konto? <span onClick={() => navigate("/")}>Zaloguj</span>
                </div>
            </div>
        </div>
    )
}

export default SignUp; 