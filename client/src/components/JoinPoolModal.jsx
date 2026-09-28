import React, { useState } from 'react';
import './JoinPoolModal.css';

export default function JoinPoolModal({ isOpen, onClose }) {
    const [poolIdInput, setPoolIdInput] = useState('');
    const [requestNote, setRequestNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    if (!isOpen) return null;

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (!poolIdInput.trim()) return;

        setIsSubmitting(true);
        
        setTimeout(() => {
            setIsSubmitting(false);
            setRequestSuccess(true);
            
            setTimeout(() => {
                handleClose();
            }, 1800);
        }, 1000);
    };

    const handleClose = () => {
        setPoolIdInput('');
        setRequestNote('');
        setRequestSuccess(false);
        setIsSubmitting(false);
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
                                placeholder="e.g. pool-2024-q1"
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