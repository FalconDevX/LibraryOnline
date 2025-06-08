import React, { useState, useEffect } from 'react';
import './History.css';
import { useNavigate } from 'react-router-dom';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8000/history', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Błąd podczas pobierania danych');
                }

                const data = await response.json();
                setHistory(data.history);
                setError(null);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('pl-PL', options);
    };

    if (loading) {
        return (
            <div className="history-container">
                <div className="history-header">
                    <button className="back-button" onClick={() => navigate('/dashboard')}>Powrót</button>
                    <h1>Historia działań</h1>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="history-container">
                <div className="history-header">
                    <button className="back-button" onClick={() => navigate('/dashboard')}>Powrót</button>
                    <h1>Historia działań</h1>
                </div>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return(
        <div className="history-container">
            <div className="history-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>Powrót</button>
                <h1>Historia działań</h1>
            </div>
            {history.length === 0 ? (
                <div className="empty-state">
                    <p>Brak historii działań.</p>
                </div>
            ) : (
                <div className="history-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Data i godzina</th>
                                <th>Akcja</th>
                                <th>Tytuł książki</th>
                                <th>Autor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item._id}>
                                    <td>{formatDate(item.date)}</td>
                                    <td>
                                        <span className={`action-badge ${item.action.toLowerCase()}`}>
                                            {item.action}
                                        </span>
                                    </td>
                                    <td>{item.book_title}</td>
                                    <td>{item.book_author}</td>
                                    <td>
                                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default History; 