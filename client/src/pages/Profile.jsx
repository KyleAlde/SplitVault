import { currentUser } from '../tempData';
import './Profile.css';

export default function Profile({ onClose }) {
    return (
        <div className="profile-page">
            <div className="profile-header">
                <button className="back-btn" onClick={onClose}>
                    ← Back
                </button>

                <h1>Profile</h1>
            </div>

            <div className="profile-info-card">
                <h2>Personal Information</h2>

                <div className="profile-info-grid">
                    <div>
                        <label>First Name</label>
                        <p>{currentUser.firstName}</p>
                    </div>

                    <div>
                        <label>Last Name</label>
                        <p>{currentUser.lastName}</p>
                    </div>

                    <div>
                        <label>Phone Number</label>
                        <p>{currentUser.phone}</p>
                    </div>

                    <div>
                        <label>Email</label>
                        <p>{currentUser.email}</p>
                    </div>
                </div>
            </div>

            <div className="transaction-card">
                <h2>Transaction History</h2>

                <p className="empty-transactions">
                    No transactions yet.
                </p>

                <div className="total-expenses">
                    <span>Total Expenses</span>
                    <strong>₱0.00</strong>
                </div>
            </div>
        </div>
    );
}