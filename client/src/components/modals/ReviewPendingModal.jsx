import { useState } from 'react';
import './ReviewPendingModal.css';

export default function ReviewPendingModal({
    isOpen,
    onClose,
    pendingClaims = [],
    categories = [],
    onApprove,
    onReject,
    isUpdating = false,
    initialSelectedId = null,
    activePoolName,
    errorMessage = '',
}) {
    // Keep track of the currently selected claim in the left queue
    const [selectedId, setSelectedId] = useState(() => initialSelectedId || pendingClaims[0]?.id || null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    if (!isOpen) return null;

    const activeSelectedId = pendingClaims.some((claim) => claim.id === selectedId)
        ? selectedId
        : pendingClaims[0]?.id;
    const activeClaim = pendingClaims.find((claim) => claim.id === activeSelectedId);

    const getCategoryColor = (categoryName) => {
        return categories.find((cat) => cat.name === categoryName)?.color || 'var(--text)';
    };

    const handleApproveClick = () => {
        if (!activeClaim) return;
        onApprove(activeClaim.id);
        setIsRejecting(false);
    };

    const handleRejectSubmit = async () => {
        if (!activeClaim) return;
        const rejected = await onReject(activeClaim.id, rejectionReason);
        if (rejected) {
            setRejectionReason('');
            setIsRejecting(false);
        }
    };

    return (
        <div className="ledger-modal-overlay" onClick={onClose}>
            <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="modal-header">
                    <div>
                        <h2>Pending Approvals</h2>
                        <p className="sub-text">Review disbursement claims and verify attached receipts</p>
                        {errorMessage && <p role="alert" style={{ color: '#b42318', margin: '8px 0 0', fontSize: 13 }}>{errorMessage}</p>}
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Split-Pane Body */}
                <div className="split-pane-container">
                    
                    {/* LEFT PANE: Master Queue List */}
                    <div className="split-pane-sidebar">
                        
                        {/* Replaced Search Box with Clean Header */}
                        <div className="sidebar-queue-header">
                            <h3 className="sidebar-queue-title">Review Queue</h3>
                            <span className="queue-count-badge">{pendingClaims.length}</span>
                        </div>

                        <div className="queue-list">
                            {pendingClaims.length === 0 ? (
                                <div className="queue-empty-state">
                                    <p>All caught up! No pending claims.</p>
                                </div>
                            ) : (
                                pendingClaims.map((claim) => {
                                    const isSelected = claim.id === activeSelectedId;
                                    return (
                                        <div 
                                            key={claim.id}
                                            className={`queue-card ${isSelected ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedId(claim.id);
                                                setIsRejecting(false);
                                            }}
                                        >
                                            <div className="queue-card-top">
                                                <span className="queue-card-title">{claim.title}</span>
                                                <span className="queue-card-amount">
                                                    ₱{Number(claim.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="queue-card-bottom">
                                                <span className="queue-card-claimant">{claim.claimant}</span>
                                                <span className="queue-card-date">{claim.date}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Detail Inspector & Receipt Viewer */}
                    <div className="split-pane-main">
                        {!activeClaim ? (
                            <div className="main-empty-inspector">
                                <div className="empty-icon">🎉</div>
                                <h3>Queue is empty</h3>
                                <p className="sub-text">There are no pending claims to review at this time.</p>
                            </div>
                        ) : (
                            <div className="inspector-content">
                                
                                {/* Metadata Section */}
                                <div className="inspector-header-section">
                                    <div className="inspector-titles">
                                        <span className="category-pill" style={{ width: 'fit-content', marginBottom: '8px' }}>
                                            <span 
                                                className="cat-dot" 
                                                style={{ backgroundColor: getCategoryColor(activeClaim.category) }}
                                            ></span>
                                            {activeClaim.category}
                                        </span>
                                        <h3>{activeClaim.title}</h3>
                                        <p className="sub-text">Submitted by <strong>{activeClaim.claimant}</strong> on {activeClaim.date}</p>
                                    </div>
                                    <div className="inspector-amount-box">
                                        <span className="sub-text">Expense Amount</span>
                                        <div className="amount-value">
                                            ₱{Number(activeClaim.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                <div className="inspector-grid">
                                    {/* Left Sub-Column: Budget Pool & Notes */}
                                    <div className="inspector-metadata-panel">
                                        <div className="meta-block">
                                            <span className="meta-label">Target Budget Pool</span>
                                            <span className="meta-value">🔵 {activeClaim.budgetPool || activePoolName}</span>
                                        </div>
                                        <div className="meta-block">
                                            <span className="meta-label">Description / Purpose</span>
                                            <p className="meta-description">
                                                {activeClaim.description || 'No additional remarks provided by the claimant for this disbursement request.'}
                                            </p>
                                        </div>

                                        {isRejecting && (
                                            <div className="rejection-box">
                                                <span className="meta-label text-danger">Reason for Rejection / Revision Request</span>
                                                <textarea 
                                                    className="ledger-textarea"
                                                    placeholder="Specify what needs to be fixed (e.g., missing official VAT receipt)..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Sub-Column: Interactive Receipt Viewer */}
                                    <div className="inspector-receipt-panel">
                                        <div className="receipt-header-row">
                                            <span className="meta-label">Attached Receipt / Proof</span>
                                            <div className="receipt-tools">
                                                <button type="button" className="receipt-tool-btn" title="Open Full Image">🔍 Zoom</button>
                                            </div>
                                        </div>
                                        <div className="receipt-viewer-box">
                                            {activeClaim.receiptUrl ? (
                                                <img src={activeClaim.receiptUrl} alt="Receipt preview" className="receipt-image" />
                                            ) : (
                                                <div className="receipt-placeholder">
                                                    <span className="placeholder-icon">📄</span>
                                                    <span>{activeClaim.receipt?.fileName || activeClaim.receipt?.filePath || 'No receipt metadata provided'}</span>
                                                    <span className="sub-text">Receipt preview is unavailable.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action & Decision Bar Footer */}
                                <div className="inspector-action-bar">
                                    {isRejecting ? (
                                        <div className="action-button-group">
                                            <button 
                                                type="button" 
                                                className="btn-secondary"
                                                onClick={() => setIsRejecting(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn-danger"
                                                onClick={handleRejectSubmit}
                                                disabled={isUpdating}
                                            >
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="action-button-group">
                                            <button 
                                                type="button" 
                                                className="btn-danger-outline"
                                                onClick={() => setIsRejecting(true)}
                                                disabled={isUpdating}
                                            >
                                                Request Changes / Reject
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn-primary-success"
                                                onClick={handleApproveClick}
                                                disabled={isUpdating}
                                            >
                                                Approve Disbursement
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}