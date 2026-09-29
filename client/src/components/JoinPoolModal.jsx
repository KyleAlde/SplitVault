import { useState } from 'react';
import { apiRequest } from '../api.js';
import './JoinPoolModal.css';

export default function JoinPoolModal({ isOpen, onClose, token }) {
    const [poolIdInput, setPoolIdInput] = useState('');
    const [requestNote, setRequestNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        const poolId = poolIdInput.trim();
        if (!poolId) return;

        setIsSubmitting(true);
        setError('');
        try {
            await apiRequest(`/pools/${encodeURIComponent(poolId)}/access-requests`, {
                token,
                method: 'POST',
                body: { requestNote },
            });
            setRequestSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 1800);
        } catch (requestError) {
            setError(requestError.message || 'Unable to send your access request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setPoolIdInput('');
        setRequestNote('');
        setRequestSuccess(false);
        setIsSubmitting(false);
        setError('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="light-card modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 8px 0', color: '#0f172a' }}>
                        Join Budget Pool
                    </h2>
                    <p>Enter the Pool ID provided by your administrator to request access.</p>
                </div>

                {requestSuccess ? (
                    <div className="success-container">
                        <div className="success-icon">✓</div>
                        <h3 className="success-title">Request Sent</h3>
                        <p className="success-subtitle">Waiting for admin approval.</p>
                    </div>
                ) : (
                    <form onSubmit={handleJoinSubmit}>
                        <div className="input-group">
                            <label htmlFor="pool-id">Pool ID</label>
                            <input
                                id="pool-id"
                                className="standard-input"
                                type="text"
                                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                                value={poolIdInput}
                                onChange={(e) => setPoolIdInput(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="request-note">Request Note (Optional)</label>
                            <textarea
                                id="request-note"
                                className="standard-input textarea-no-resize"
                                rows="3"
                                placeholder="Let the admin know why you need access..."
                                value={requestNote}
                                onChange={(e) => setRequestNote(e.target.value)}
                            />
                        </div>

                        {error && <p className="join-request-error" role="alert">{error}</p>}

                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="btn-outline" 
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn-brand-custom" 
                                disabled={isSubmitting || !poolIdInput.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Request Access'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}