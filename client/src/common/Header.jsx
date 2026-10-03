import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notifButton from '../assets/notif_button.svg';
import homeButton from '../assets/home_button.svg';
import settingsButton from '../assets/settings_button.svg';
import { apiRequest } from '../api.js';
import './Header.css';

export default function Header({ currentUser, token, pools, selectedPoolId, userRole, onPoolChange, onProfile, onSettings, onHome, onNotificationAction }) {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const initials = currentUser?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    const unreadNotifications = notifications.filter((notification) => !notification.read);

    useEffect(() => {
        if (!token || !currentUser) {
            setNotifications([]);
            return undefined;
        }

        let isMounted = true;

        async function loadNotifications() {
            try {
                const response = await apiRequest('/notifications', { token });
                if (isMounted) {
                    setNotifications(response.notifications || []);
                }
            } catch {
                if (isMounted) {
                    setNotifications([]);
                }
            }
        }

        loadNotifications();

        return () => {
            isMounted = false;
        };
    }, [token, currentUser]);

    const handleMarkRead = async (notificationId) => {
        if (!token) return;

        try {
            const response = await apiRequest(`/notifications/${notificationId}/read`, {
                token,
                method: 'PATCH',
            });

            setNotifications((currentNotifications) => currentNotifications.map((notification) => (
                notification.id === notificationId ? response.notification || { ...notification, read: true } : notification
            )));
        } catch {
            setNotifications((currentNotifications) => currentNotifications.map((notification) => (
                notification.id === notificationId ? { ...notification, read: true } : notification
            )));
        }
    };

    const handleMarkAllRead = async () => {
        if (!token || unreadCount === 0) return;

        try {
            await apiRequest('/notifications/read-all', {
                token,
                method: 'PATCH',
            });
            setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
                ...notification,
                read: true,
            })));
        } catch {
            setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
                ...notification,
                read: true,
            })));
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await handleMarkRead(notification.id);
        }

        onNotificationAction?.(notification);

        if (notification.link) {
            navigate(notification.link);
        }
        setIsNotificationsOpen(false);
    };

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

                <button className="icon-btn" aria-label="Home" title="Home" onClick={onHome}>
                    <img src={homeButton} alt="" className="nav-icon-img" />
                </button>

                {userRole === 'ADMIN' && (
                    <button className="icon-btn" aria-label="Settings" title="Pool Management" onClick={onSettings}>
                        <img src={settingsButton} alt="" className="nav-icon-img" />
                    </button>
                )}

                <div className="notification-wrapper">
                    <button
                        type="button"
                        className="icon-btn notification-btn"
                        aria-label="Notifications"
                        title="Notifications"
                        onClick={() => setIsNotificationsOpen((open) => !open)}
                    >
                        <img src={notifButton} alt="" className="nav-icon-img" />
                        {unreadCount > 0 && <span className="notification-dot" aria-label={`${unreadCount} unread notifications`} />}
                    </button>

                    {isNotificationsOpen && (
                        <div className="notification-panel" role="dialog" aria-label="Notifications panel">
                            <div className="notification-panel-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button type="button" className="notification-mark-all" onClick={handleMarkAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {unreadNotifications.length === 0 ? (
                                <div className="notification-empty">No notifications yet.</div>
                            ) : (
                                <div className="notification-list">
                                    {unreadNotifications.slice(0, 8).map((notification) => (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="notification-item-header">
                                                <span className="notification-title">{notification.title}</span>
                                                {!notification.read && <span className="notification-unread-pill" />}
                                            </div>
                                            <p>{notification.message}</p>
                                            <small>{new Date(notification.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

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