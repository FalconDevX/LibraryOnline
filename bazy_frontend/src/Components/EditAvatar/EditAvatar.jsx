import './EditAvatar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import React, { useRef, useState } from 'react';

const EditAvatar = ({ onClose, userId, onAvatarChange }) => {
    const fileInput = useRef();
    const [loading, setLoading] = useState(false);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        await fetch('http://localhost:8000/upload-avatar', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        setLoading(false);
        onAvatarChange && onAvatarChange();
        onClose();
        setAvatarVersion(Date.now());
    };

    return (
        <div className="edit-avatar-container">
            <div className="close-button" onClick={onClose}>
                <FontAwesomeIcon icon={faX} />
            </div>
            <input
                type="file"
                accept="image/png, image/jpeg"
                ref={fileInput}
                style={{ display: 'none' }}
                onChange={handleUpload}
            />
            <button className="choose-avatar-button" onClick={() => fileInput.current.click()} disabled={loading}>
                {loading ? 'Wysyłanie...' : 'Wybierz avatar'}
            </button>
            <img src={`http://localhost:8000/avatar/${userId}?v=${avatarVersion}`} alt="avatar" />
        </div>
    );
};

export default EditAvatar;