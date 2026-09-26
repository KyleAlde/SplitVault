import { useState } from 'react';
import { currentUser } from '../tempData';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
    const [email, setEmail] = useState(currentUser.email);
    const [phone, setPhone] = useState(currentUser.phone);
    const [password, setPassword] = useState('');

    const handleSave = () => {
        console.log('Updated Email:', email);
        console.log('Updated Phone:', phone);

        if (password) {
            console.log('Password was changed');
        }

        alert('Settings updated successfully!');
        onClose();
    };

    return (
        <div className="settings-modal-overlay">
            <div className="settings-modal">

                <div className="settings-modal-header">
                    <div>
                        <h2>Settings</h2>
                        <p>Manage your account information</p>
                    </div>

                    <button
                        className="settings-close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="settings-section">

                    <div className="settings-field">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="settings-field">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="settings-field">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                    </div>

                </div>

                <div className="settings-modal-footer">
                    <button
                        className="settings-cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="settings-save-btn"
                        onClick={handleSave}
                    >
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}