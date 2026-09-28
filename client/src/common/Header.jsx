import notifButton from '../assets/notif_button.svg';
import homeButton from '../assets/home_button.svg';
import settingsButton from '../assets/settings_button.svg';
import './Header.css';

export default function Header({ currentUser, pools, selectedPoolId, onPoolChange, onProfile, onSettings, onHome }) {
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

                {/* Home Button */}
                <button className="icon-btn" aria-label="Home" title="Home" onClick={onHome}>
                    <img src={homeButton} alt="" className="nav-icon-img" />
                </button>

                {/* Settings / Pool Management Button (Admin Only) */}
                {currentUser?.role === 'ADMIN' && (
                    <button className="icon-btn" aria-label="Settings" title="Pool Management" onClick={onSettings}>
                        <img src={settingsButton} alt="" className="nav-icon-img" />
                    </button>
                )}

                {/* Notifications Button */}
                <button className="icon-btn" aria-label="Notifications" title="Notifications">
                    <img src={notifButton} alt="" className="nav-icon-img" />
                </button>

                {/* Profile Button - Opens Profile modal */}
                <button
                    className="avatar-btn"
                    title={`${currentUser.name} (${currentUser.role})`}
                    aria-label="Profile Options"
                    onClick={onProfile}
                >
                    {initials}
                </button>
            </div>
        </header>
    );
}