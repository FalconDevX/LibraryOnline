import React, { useEffect, useState } from 'react';
import './Review.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const Review = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());
    const [rating, setRating] = useState(0);
    const location = useLocation();
    const { libraryBookId, title } = location.state || {};
    const [reviewText, setReviewText] = useState('');

    const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Nie jesteś zalogowany");
        return;
    }

    if (!libraryBookId) {
        alert("Brak ID książki");
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                library_book_id: libraryBookId,
                rating: rating,
                comment: reviewText
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Błąd podczas wysyłania recenzji");
        }

        const result = await response.json();
        alert("Recenzja została zapisana!");
        navigate('/dashboard');

    } catch (error) {
        console.error("Błąd:", error.message);
        alert("Nie udało się wysłać recenzji: " + error.message);
    }
};


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }

                const response = await fetch('http://localhost:8000/account', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/');
            }
        };

        fetchUser();
    }, [navigate]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return(
        <div className="review">
            <div className='review-header'>
                <h2>Wystaw ocene</h2>
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    Moje książki
                </button>
                <img className="avatar" src={`http://localhost:8000/avatar/${user.id}?v=${avatarVersion}`} alt="avatar" />
                
            </div>
            <div className='review-section'>
                <h3>Ocena książki</h3>
                <h4>{title ? title : "Brak tytułu książki (wejdź przez przycisk 'Wystaw recenzję')"}</h4>
                <div className="stars-row">
                {[...Array(10)].map((_, i) => (
                    <FontAwesomeIcon
                    key={i}
                    icon={i < rating ? faStarSolid : faStarRegular}
                    style={{ color: '#FFD700', fontSize: '2rem', marginRight: '4px', cursor: 'pointer' }}
                    onClick={() => setRating(i + 1)}
                    />
                ))}
                </div>
                <textarea
                    className="review-textarea"
                    placeholder="Napisz swoją opinię o książce..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                />
                <button className="submit-review-button" onClick={handleSubmit}>
                    Wyślij recenzję
                </button>
            </div>
        
        </div>
    );
};

export default Review;