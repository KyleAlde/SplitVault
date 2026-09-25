import { useState } from 'react';
import './Sidebar.css';

function NavIcon({ type }) {
    const paths = {
        dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        pools: <><path d="M4 7.5 12 4l8 3.5L12 11 4 7.5Z" /><path d="m4 12 8 3.5 8-3.5M4 16.5l8 3.5 8-3.5" /></>,
        claims: <><path d="M7 3h8l3 3v15H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M15 3v4h4M9 12h6M9 16h4" /></>,
        settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H20a1.7 1.7 0 0 0-.6 1.2Z" /></>,
    };

    return (
        <svg className="sidebar-nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {paths[type]}
        </svg>
    );
}

export default function Sidebar({ user, onLogout }) {
    const [activeItem, setActiveItem] = useState('Dashboard');
    const initials = user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const navigation = [
        { label: 'Dashboard', icon: 'dashboard' },
        { label: 'Budget Pools', icon: 'pools' },
        { label: 'Expense Claims', icon: 'claims' },
        { label: 'Organization', icon: 'settings' },
    ];

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <span className="sidebar-brand-mark">S</span>
                <span>SPLITVAULT</span>
            </div>

            <nav className="sidebar-navigation" aria-label="Primary navigation">
                <span className="sidebar-section-label">Workspace</span>
                {navigation.map((item) => (
                    <button
                        className={`sidebar-nav-item ${activeItem === item.label ? 'sidebar-nav-item-active' : ''}`}
                        type="button"
                        key={item.label}
                        onClick={() => setActiveItem(item.label)}
                    >
                        <NavIcon type={item.icon} />
                        <span>{item.label}</span>
                        {item.label === 'Dashboard' && <span className="sidebar-active-dot" />}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-workspace-switcher">
                    <span className="sidebar-workspace-icon">S</span>
                    <span className="sidebar-workspace-copy">
                        <small>Workspace</small>
                        <strong>SplitVault HQ</strong>
                    </span>
                    <span className="sidebar-chevron">⌄</span>
                </div>
                <div className="sidebar-profile">
                    <span className="sidebar-avatar">{initials}</span>
                    <span className="sidebar-profile-copy">
                        <strong>{user.name}</strong>
                        <small>{user.role}</small>
                    </span>
                    <button className="sidebar-logout" type="button" onClick={onLogout} aria-label="Logout" title="Logout">
                        ↗
                    </button>
                </div>
            </div>
        </aside>
    );
}
