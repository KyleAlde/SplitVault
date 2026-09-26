import notifButton from '../assets/notif_button.svg';
import './Header.css';
import { useState } from 'react';

export default function Header({ currentUser, pools, selectedPoolId, onPoolChange, onLogout, onProfile, onSettings }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const initials = currentUser?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
    return (
        <header className="floating-header">
            <div className="header-left">
                <div className="brand-name">
                    SPLITVAULT
                </div>
            </div>

            <div className="header-right">
                <div className="pool-selector-wrapper">
                    <select
                        className="pool-selector"
                        value={selectedPoolId}
                        onChange={(e) => onPoolChange(e.target.value)}
                    >
                        {pools.length === 0 && <option value="">No budget pools</option>}
                        {pools.map((pool) => (
                            <option key={pool.id} value={pool.id}>
                                {pool.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="icon-btn" aria-label="Notifications" title="Notifications">
                    <img src={notifButton} alt="" className="nav-icon-img" />
                </button>

                {/* User initials avatar with hover tooltip for name & role */}
                <div className ="profile-container">
                    <button
                        className="avatar-btn"
                        title={`${currentUser.name} (${currentUser.role})`}
                        aria-label="Account Options"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            {initials}
                        </button>

                        {showProfileMenu && (
                            <div className="profile-menu">
                                <button onClick={() => { setShowProfileMenu(false); onProfile(); }}>Profile</button>
                                {currentUser.role === 'ADMIN' && <button onClick={() => { setShowProfileMenu(false); onSettings(); }}>Pool Management</button>}
                                <button onClick={onLogout}>Logout</button>
                            </div>
                        )}
                </div>
            </div>
        </header>
    )
}