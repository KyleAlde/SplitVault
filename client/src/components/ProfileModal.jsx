import { currentUser } from '../tempData';
import './ProfileModal.css';

export default function ProfileModal({ onClose }) {
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
                            <span>FIRST NAME</span>
                            <strong>{currentUser.firstName}</strong>
                        </div>

                        <div className="profile-info-item">
                            <span>LAST NAME</span>
                            <strong>{currentUser.lastName}</strong>
                        </div>

                        <div className="profile-info-item">
                            <span>PHONE NUMBER</span>
                            <strong>{currentUser.phone}</strong>
                        </div>

                        <div className="profile-info-item">
                            <span>EMAIL</span>
                            <strong>{currentUser.email}</strong>
                        </div>

                    </div>
                </div>

                <div className="profile-section">
                    <h3>Transaction History</h3>

                    <div className="no-transactions">
                        No transactions found for this account.
                    </div>
                </div>

                <div className="profile-total">
                    <span>Total Expenses</span>
                    <strong>₱0.00</strong>
                </div>

            </div>
        </div>
    );
}