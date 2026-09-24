import { currentUser, budgetPools } from '../tempData';
import notifButton from '../assets/notif_button.svg';
import './Header.css';

export default function Header({ selectedPoolId, onPoolChange }) {
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
                        {budgetPools.map((pool) => (
                            <option key={pool.id} value={pool.id}>
                                {pool.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="icon-btn" aria-label="Notifications" title="Notifications">
                    <img src={notifButton} alt="" className="nav-icon-img" />
                    {currentUser.hasUnreadNotifications && (
                        <span className="notification-dot" />
                    )}
                </button>

                {/* User initials avatar with hover tooltip for name & role */}
                <button 
                    className="avatar-btn" 
                    title={`${currentUser.name} (${currentUser.role})`}
                    aria-label="Account options"
                >
                    {currentUser.initials}
                </button>
            </div>
        </header>
    )
}