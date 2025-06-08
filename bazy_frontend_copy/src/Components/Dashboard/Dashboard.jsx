import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faCog, faBook } from '@fortawesome/free-solid-svg-icons'
import BooksList from '../BooksList/BooksList';

function Dashboard() {
  const [user, setUser] = useState(null);
  const email = localStorage.getItem("userEmail");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token || !email) {
      navigate("/");
      return;
    }

    fetch("http://localhost:8000/account", {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        navigate("/");
      });
  }, [email, navigate]);

  if (!user) return null;

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="user-floating-header">
          <div className="user-hover-area">
            <img
              src={`http://localhost:8000/avatar/${user.id}?t=${Date.now()}`}
              alt="avatar"
              className="dashboard-avatar"
            />
            <span className="username">{user?.username || "Użytkownik"}</span>
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate('/settings')}>
                <FontAwesomeIcon icon={faCog} style={{ marginRight: "8px" }}/>
                Ustawienia
              </div>
              <div className="dropdown-item" onClick={() => navigate('/history')}>
                <FontAwesomeIcon icon={faBook} style={{ marginRight: "8px" }} />
                Historia
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                <FontAwesomeIcon icon={faX} style={{ marginRight: "8px" }} />
                Wyloguj
              </div>
            </div>
          </div>
        </div>
        <BooksList token={localStorage.getItem("token")} />
      </div>
    </div>
  );
}

export default Dashboard; 