import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SignIn from './Components/SignIn/SignIn';
import SignUp from './Components/SignUp/SignUp';
import Dashboard from './Components/Dashboard/Dashboard';
import Settings from './Components/Settings/Settings';
import History from './Components/History/History';
import Review from './Components/Review/Review';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<SignIn onLogin={handleLogin} />} />
            <Route path="/register" element={<SignUp onLogin={handleLogin} />} />
            <Route 
              path="/dashboard" 
              element={
                token ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />}/>
            <Route path="/review" element={<Review/>}/>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
