import React, { useState, useEffect } from 'react';
import './BooksList.css';
import { useNavigate, useLocation } from 'react-router-dom';

const BooksList = ({ token }) => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [availableBooks, setAvailableBooks] = useState([]);
    const [showAvailable, setShowAvailable] = useState(false);

    useEffect(() => {
        fetchBooks();
        fetchAvailableBooks();
    }, [token]);

    const fetchBooks = async () => {
        try {
            const response = await fetch('http://localhost:8000/books', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }

            const data = await response.json();
            setBooks(data);
        } catch (error) {
            console.error('Error fetching books:', error);
        }
    };

    const fetchAvailableBooks = async () => {
        try {
            const response = await fetch('http://localhost:8000/available-books', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch available books');
            }

            const data = await response.json();
            setAvailableBooks(data);
        } catch (error) {
            console.error('Error fetching available books:', error);
        }
    };

    const handleBorrow = async (bookId) => {
        try {
            const response = await fetch(`http://localhost:8000/borrow-book/${bookId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.detail || 'Błąd wypożyczenia książki.');
                return;
            }

            fetchBooks();
            fetchAvailableBooks();
        } catch (error) {
            alert('Błąd połączenia z serwerem.');
        }
    };

    const handleReturn = async (bookId) => {
        try {
            const response = await fetch(`http://localhost:8000/return-book/${bookId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to return book');
            }

            fetchBooks();
            fetchAvailableBooks();
        } catch (error) {
            console.error('Error returning book:', error);
        }
    };

    return (
        <div className="books-container">
            {showAvailable ? (
                <div className="available-books">
                    <div className="books-header-flex">
                        <h2>Dostępne książki</h2>
                        <button 
                            className="toggle-button"
                            onClick={() => setShowAvailable(false)}
                        >
                            Moje książki
                        </button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tytuł</th>
                                <th>Autor</th>
                                <th>Dostępne egzemplarze</th>
                                <th>Akcja</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableBooks.map((book) => (
                                <tr key={book.id}>
                                    <td>{book.title}</td>
                                    <td>{book.author}</td>
                                    <td>{typeof book.total_copies === "number" && typeof book.borrowed_copies === "number" ? book.total_copies - book.borrowed_copies : "?"}</td>
                                    <td>
                                        <button 
                                            onClick={() => handleBorrow(book.id)}
                                            disabled={book.borrowed_copies >= book.total_copies}
                                        >
                                            Wypożycz
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="my-books">
                    <div className="books-header-flex">
                        <h2>Moje książki</h2>
                        <button 
                            className="toggle-button"
                            onClick={() => setShowAvailable(true)}
                        >
                            Dostępne książki
                        </button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tytuł</th>
                                <th>Data wypożyczenia</th>
                                <th>Data zwrotu</th>
                                <th>Pozostało dni</th>
                                <th>Status</th>
                                <th>Akcja</th>
                                <th>Recenzja</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map((book) => {
                                const today = new Date();
                                const returnDate = new Date(book.returnBy);
                                const diffTime = returnDate - today;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return (
                                    <tr key={book.id}>
                                        <td>{book.title}</td>
                                        <td>{new Date(book.borrowedAt).toLocaleDateString()}</td>
                                        <td>{new Date(book.returnBy).toLocaleDateString()}</td>
                                        <td>{diffDays}</td>
                                        <td>{book.status}</td>
                                        <td>
                                            <button 
                                                className="return-button"
                                                onClick={() => handleReturn(book.id)}
                                            >
                                                Zwróć
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                className="review-button"
                                                onClick={() => navigate('/review', { state: { libraryBookId: book.library_book_id, title: book.title } })}

                                            >
                                                
                                                Wystaw recenzję    
                                            </button>    
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BooksList; 