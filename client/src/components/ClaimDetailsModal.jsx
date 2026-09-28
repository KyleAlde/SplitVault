import { getAssetUrl } from '../api.js';
import './modals/ReviewPendingModal.css';

function getDriveFileId(filePath) {
    if (!filePath) return null;
    try {
        const url = new URL(filePath);
        if (!['drive.google.com', 'docs.google.com'].includes(url.hostname)) return null;
        return url.pathname.match(/\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id');
    } catch {
        return null;
    }
}

export default function ClaimDetailsModal({
    isOpen,
    onClose,
    onBack,
    claim,
    categories = [],
    activePoolName,
}) {
    if (!isOpen || !claim) return null;

    const receipt = claim?.receipt;
    const receiptUrl = receipt?.filePath ? getAssetUrl(receipt.filePath) : '';
    const driveFileId = getDriveFileId(receipt?.filePath);
    const receiptPreviewUrl = driveFileId
        ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1600`
        : receiptUrl;
    const isImageReceipt = /^image\/(avif|bmp|gif|jpeg|png|tiff|webp)$/i.test(receipt?.mimeType || '');

    const getCategoryColor = (categoryName) => {
        return categories.find((cat) => cat.name === categoryName)?.color || 'var(--text)';
    };

    return (
        <div className="ledger-modal-overlay" onClick={onClose}>
            <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <h2>Transaction Details</h2>
                            <p className="sub-text">Audit details and verification proof for approved disbursement</p>
                        </div>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Main Content Area (Inspector Layout) */}
                <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                    <div className="inspector-content" style={{ padding: 0 }}>
                        
                        {/* Metadata Section */}
                        <div className="inspector-header-section">
                            <div className="inspector-titles">
                                <span className="category-pill" style={{ width: 'fit-content', marginBottom: '8px' }}>
                                    <span 
                                        className="cat-dot" 
                                        style={{ backgroundColor: getCategoryColor(claim.category) }}
                                    ></span>
                                    {claim.category}
                                </span>
                                <h3>{claim.title}</h3>
                                <p className="sub-text">Submitted by <strong>{claim.claimant}</strong> on {claim.date}</p>
                            </div>
                            <div className="inspector-amount-box">
                                <span className="sub-text">Disbursed Amount</span>
                                <div className="amount-value">
                                    ₱{Number(claim.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        <div className="inspector-grid" style={{ marginTop: '20px' }}>
                            {/* Left Sub-Column: Budget Pool & Notes */}
                            <div className="inspector-metadata-panel">
                                <div className="meta-block" style={{ marginBottom: '16px' }}>
                                    <span className="meta-label">Target Budget Pool</span>
                                    <span className="meta-value">🔵 {claim.budgetPool || activePoolName || 'Default Pool'}</span>
                                </div>
                                <div className="meta-block" style={{ marginBottom: '16px' }}>
                                    <span className="meta-label">Description / Purpose</span>
                                    <p className="meta-description">
                                        {claim.description || 'No additional remarks provided by the claimant for this disbursement request.'}
                                    </p>
                                </div>
                                <div className="meta-block">
                                    <span className="meta-label">Status</span>
                                    <span className="meta-value" style={{ color: '#10b981', fontWeight: 600 }}>● {claim.status || 'Approved'}</span>
                                </div>
                            </div>

                            {/* Right Sub-Column: Interactive Receipt Viewer */}
                            <div className="inspector-receipt-panel">
                                <div className="receipt-header-row">
                                    <span className="meta-label">Attached Receipt / Proof</span>
                                    <div className="receipt-tools">
                                        {receiptUrl && isImageReceipt && (
                                            <a className="receipt-tool-btn" href={receiptUrl} target="_blank" rel="noopener noreferrer">
                                                🔍 Open full image
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="receipt-viewer-box">
                                    {receiptUrl && isImageReceipt ? (
                                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer" aria-label="Open full receipt image">
                                            <img
                                                src={receiptPreviewUrl}
                                                alt={receipt.fileName ? `Receipt: ${receipt.fileName}` : 'Receipt preview'}
                                                className="receipt-image"
                                            />
                                        </a>
                                    ) : receiptUrl ? (
                                        <a className="receipt-tool-btn" href={receiptUrl} target="_blank" rel="noopener noreferrer">
                                            Open receipt document{receipt.fileName ? `: ${receipt.fileName}` : ''}
                                        </a>
                                    ) : (
                                        <div className="receipt-placeholder">
                                            <span className="placeholder-icon">📄</span>
                                            <span>N/A</span>
                                            <span className="sub-text">Receipt preview is unavailable.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <span className="sub-text">Claim ID: {claim.id}</span>
                    <button 
                        type="button" 
                        className="btn-close-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}