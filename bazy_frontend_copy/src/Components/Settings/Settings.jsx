import React, { useEffect, useState } from 'react';
import './Settings.css';
import { useNavigate } from 'react-router-dom';
import {faPen} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EditAvatar from '../EditAvatar/EditAvatar';

const Settings = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        email: '',
        birth_date: '',
        faculty: '',
        field_of_study: '',
        phone_number: '',
        student_id: ''
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [showEditAvatar, setShowEditAvatar] = useState(false);
    const [user, setUser] = useState(null);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:8000/account', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                setForm({
                    username: data.user.username || '',
                    email: data.user.email || '',
                    birth_date: data.user.birth_date || '',
                    faculty: data.user.faculty || '',
                    field_of_study: data.user.field_of_study || '',
                    phone_number: data.user.phone_number || '',
                    student_id: data.user.student_id || ''
                });
                setUser(data.user);
                console.log("user._id:", data.user?._id, data.user);
            } catch (e) {
                setMessage('Błąd ładowania danych użytkownika');
            }
        };
        fetchUser();
    }, []);

    const handleAvatarClick = () => {
        
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/update-user-info', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setMessage('Dane zapisane!');
            } else {
                setMessage('Błąd zapisu danych');
            }
        } catch (e) {
            setMessage('Błąd zapisu danych');
        }
        setSaving(false);
    };

    const handleAvatarChange = () => {
        setAvatarVersion(Date.now());
    };

    return (
        <div className="settings">
            <div className="settings-header">
                <h2>Ustawienia konta</h2>
                <div className="avatar-container" onClick={() => setShowEditAvatar(true)} style={{cursor: 'pointer'}}>
                    {user && (
                        <img
                            src={`http://localhost:8000/avatar/${user.id}?v=${avatarVersion}`}
                            alt="avatar"
                            className="dashboard-avatar"
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                    <div className="avatar-edit-overlay">
                        <FontAwesomeIcon icon={faPen} />
                    </div>
                </div>
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    Moje książki
                </button>
            </div>
            {showEditAvatar && user && (
                <EditAvatar
                    onClose={() => setShowEditAvatar(false)}
                    userId={user._id}
                    onAvatarChange={handleAvatarChange}
                />
            )}
            <div className="settings-section">
                <div className="setting-item">
                    <label>Nazwa użytkownika:
                        <input type="text" name="username" value={form.username} onChange={handleChange} disabled />
                    </label>
                </div>
                <div className="setting-item">
                    <label>Email:
                        <input type="email" name="email" value={form.email} onChange={handleChange} disabled />
                    </label>
                </div>
                <div className="setting-item">
                    <label>Data urodzenia:
                        <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} />
                    </label>
                </div>
                <div className="setting-item">
                    <label>Wydział:
                        <input type="text" name="faculty" value={form.faculty} onChange={handleChange} />
                    </label>
                </div>
                <div className="setting-item">
                    <label>Kierunek:
                        <input type="text" name="field_of_study" value={form.field_of_study} onChange={handleChange} />
                    </label>
                </div>
                <div className="setting-item">
                    <label>Telefon:
                        <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange} />
                    </label>
                </div>
                <div className="setting-item">
                    <label>Nr indeksu:
                        <input type="text" name="student_id" value={form.student_id} onChange={handleChange} />
                    </label>
                </div>
            </div>
            <button className="save-button" onClick={handleSave} disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
            </button>
            {message && <div style={{marginTop: '16px', color: message.includes('Błąd') ? 'red' : 'green'}}>{message}</div>}
        </div>
    );
};

export default Settings; 