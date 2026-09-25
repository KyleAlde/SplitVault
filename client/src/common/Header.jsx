import { useEffect, useRef, useState } from 'react';
import notifButton from '../assets/notif_button.svg';
import './Header.css';

export default function Header({ selectedPoolId, pools, user, onPoolChange, onLogout }) {
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const accountMenuRef = useRef(null);

    useEffect(() => {
        if (!isAccountMenuOpen) return undefined;

        function handleDocumentClick(event) {
            if (!accountMenuRef.current?.contains(event.target)) {
                setIsAccountMenuOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setIsAccountMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleDocumentClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isAccountMenuOpen]);

    function handleLogout() {
        setIsAccountMenuOpen(false);
        onLogout();
    }
    return (
        <header className="floating-header">
            <div className="header-left">
                <div className="brand-name">SPLITVAULT</div>
            </div>
            <div className="header-right">
                <div className="pool-selector-wrapper">
                    <select className="pool-selector" value={selectedPoolId} onChange={(e) => onPoolChange(e.target.value)}>
                        {pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
                    </select>
                </div>
                <button className="icon-btn" aria-label="Notifications" title="Notifications">
                    <img src={notifButton} alt="" className="nav-icon-img" />
                </button>
                <div className="account-menu-wrapper" ref={accountMenuRef}>
                <button
                    className="avatar-btn"
                    type="button"
                    title={`${user.name} (${user.role})`}
                    aria-label="Account options"
                    aria-haspopup="menu"
                    aria-expanded={isAccountMenuOpen}
                    onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                >
                    {user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                </button>
                {isAccountMenuOpen && (
                    <div className="account-menu" role="menu">
                        <div className="account-menu-user">
                            <strong>{user.name}</strong>
                            {user.email && <span>{user.email}</span>}
                        </div>
                        <button className="logout-btn" type="button" role="menuitem" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                )}
                </div>
            </div>
        </header>
    );
}
