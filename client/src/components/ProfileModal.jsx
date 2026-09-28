import './ProfileModal.css';

export default function ProfileModal({ user, onClose, onLogout }) {
    const [firstName, ...lastNameParts] = (user?.name || '').split(' ');
    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal">

                <div className="profile-modal-header">
                    <div>
                        <h2>Profile</h2>
                        <p>Your account information</p>
                    </div>

                    <button
                        className="profile-close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="profile-section">
                    <h3>Personal Information</h3>

                    <div className="profile-info-grid">

                        <div className="profile-info-item">
                            <span>NAME</span>
                            <strong>{[firstName, ...lastNameParts].filter(Boolean).join(' ') || '—'}</strong>
                        </div>

                        <div className="profile-info-item">
                            <span>ROLE</span>
                            <strong>{user?.role || '—'}</strong>
                        </div>

                        <div className="profile-info-item">
                            <span>EMAIL</span>
                            <strong>{user?.email || '—'}</strong>
                        </div>

                    </div>
                </div>

                <div className="profile-section">
                    <h3>Account ID</h3>
                    <div className="no-transactions">{user?.id || '—'}</div>
                </div>

                <div className="profile-footer">
                    <button
                        className="profile-logout-btn"
                        type="button"
                        onClick={onLogout}
                    >
                        Log Out
                    </button>
                </div>

            </div>
        </div>
    );
}