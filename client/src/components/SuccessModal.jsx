import './SuccessModal.css';

export default function SuccessModal({ title, message, onClose }) {
    return (
        <div className="success-modal-overlay">
            <div
                className="success-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-modal-title"
                aria-describedby="success-modal-message"
            >
                <div className="success-modal-icon" aria-hidden="true">✓</div>
                <h2 id="success-modal-title">{title}</h2>
                <p id="success-modal-message">{message}</p>
                <button type="button" onClick={onClose} autoFocus>
                    Done
                </button>
            </div>
        </div>
    );
}
