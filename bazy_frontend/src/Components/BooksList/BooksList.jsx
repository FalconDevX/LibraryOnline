import React, { useState, useEffect } from 'react';
import './BooksList.css';

const BooksList = ({ token }) => {
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
            setBooks(data.books);
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
            setAvailableBooks(data.books);
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
                throw new Error('Failed to borrow book');
            }

            fetchBooks();
            fetchAvailableBooks();
        } catch (error) {
            console.error('Error borrowing book:', error);
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
                                <tr key={book._id}>
                                    <td>{book.title}</td>
                                    <td>{book.author}</td>
                                    <td>{book.totalCopies - book.borrowedCopies}</td>
                                    <td>
                                        <button 
                                            onClick={() => handleBorrow(book._id)}
                                            disabled={book.borrowedCopies >= book.totalCopies}
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
                            </tr>
                        </thead>
                        <tbody>
                            {books.map((book) => {
                                const today = new Date();
                                const returnDate = new Date(book.returnBy);
                                const diffTime = returnDate - today;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return (
                                    <tr key={book._id}>
                                        <td>{book.title}</td>
                                        <td>{new Date(book.borrowedAt).toLocaleDateString()}</td>
                                        <td>{new Date(book.returnBy).toLocaleDateString()}</td>
                                        <td>{diffDays}</td>
                                        <td>{book.status}</td>
                                        <td>
                                            <button 
                                                className="return-button"
                                                onClick={() => handleReturn(book._id)}
                                                disabled={book.status !== 'wypożyczona'}
                                            >
                                                Zwróć
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