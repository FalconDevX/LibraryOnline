import React, { useState } from 'react';
import './SignIn.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const SignIn = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      onLogin(data.access_token);
      localStorage.setItem("userEmail", email);
      navigate("/dashboard");
    } catch (error) {
      setError('Nieprawidłowy email lub hasło');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Logowanie</div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="inputs">
        <div className="input">
          <FontAwesomeIcon icon={faEnvelope} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input">
          <FontAwesomeIcon icon={faLock} />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="submit-container">
        <div className="forgot-password">
          <span>Zapomniałeś hasła?</span>
        </div>
        <div className="submit" onClick={handleSubmit}>
          Zaloguj się
        </div>
        <div className="register-link">
          Nie masz konta? <span onClick={() => navigate("/register")}>Zarejestruj się</span>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 