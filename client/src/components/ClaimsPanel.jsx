import { useCallback, useEffect, useState } from 'react';
import { approveClaim, getClaims, rejectClaim } from '../api';
import './ClaimsPanel.css';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
});

function formatDate(value) {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date);
}

function formatStatus(status) {
    return status?.toLowerCase() || 'unknown';
}

export default function ClaimsPanel({ poolId, user, refreshToken = 0, onClaimReviewed }) {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reviewingClaimId, setReviewingClaimId] = useState('');
    const [feedback, setFeedback] = useState(null);

    const loadClaims = useCallback(async () => {
        if (!poolId) return;

        setLoading(true);
        setError('');
        try {
            const { claims: nextClaims } = await getClaims(poolId);
            setClaims(nextClaims);
        } catch (requestError) {
            setClaims([]);
            setError(requestError.message);
            throw requestError;
        } finally {
            setLoading(false);
        }
    }, [poolId]);

    useEffect(() => {
        let active = true;

        if (!poolId) {
            return () => {
                active = false;
            };
        }

        Promise.resolve()
            .then(() => {
                if (!active) return null;
                return loadClaims();
            })
            .catch(() => {
                if (!active) return;
            });

        return () => {
            active = false;
        };
    }, [loadClaims, poolId, refreshToken]);

    async function reviewClaim(claim, action) {
        if (reviewingClaimId) return;
        if (action === 'reject' && !window.confirm(`Reject "${claim.title}"?`)) return;

        setReviewingClaimId(claim.id);
        setFeedback(null);
        setError('');
        try {
            if (action === 'approve') {
                await approveClaim(claim.id);
            } else {
                await rejectClaim(claim.id);
            }
            await loadClaims();
            onClaimReviewed?.();
            setFeedback({
                type: 'success',
                message: `Claim ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
            });
        } catch (requestError) {
            setFeedback({ type: 'error', message: requestError.message });
        } finally {
            setReviewingClaimId('');
        }
    }

    return (
        <section className="claims-panel" aria-labelledby="claims-heading">
            <div className="claims-panel-header">
                <div>
                    <h2 id="claims-heading">Expense Claims</h2>
                    <p>Claims submitted in the selected budget pool</p>
                </div>
                {!loading && !error && <span className="claims-count">{claims.length} {claims.length === 1 ? 'claim' : 'claims'}</span>}
            </div>

            {loading && <p className="claims-message">Loading claims...</p>}
            {!loading && error && <p className="claims-message claims-message-error" role="alert">{error}</p>}
            {feedback && (
                <p className={`claims-message claims-message-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
                    {feedback.message}
                </p>
            )}
            {!loading && !error && claims.length === 0 && (
                <p className="claims-message">No expense claims are available for this pool.</p>
            )}
            {!loading && !error && claims.length > 0 && (
                <div className="claims-list">
                    {claims.map((claim) => (
                        <article className="claim-card" key={claim.id}>
                            <div className="claim-card-header">
                                <div className="claim-title-group">
                                    <h3>{claim.title}</h3>
                                    <span>{claim.claimant?.name || 'Unknown contributor'}</span>
                                </div>
                                <div className="claim-summary">
                                    <strong>{currencyFormatter.format(Number(claim.amount) || 0)}</strong>
                                    <span className={`claim-status claim-status-${formatStatus(claim.status)}`}>
                                        {claim.status || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="claim-details">
                                <div>
                                    <span className="claim-detail-label">Category</span>
                                    <span>{claim.category?.name || 'Uncategorized'}</span>
                                </div>
                                <div>
                                    <span className="claim-detail-label">Date</span>
                                    <span>{formatDate(claim.incurredAt)}</span>
                                </div>
                                <div className="claim-description">
                                    <span className="claim-detail-label">Purpose</span>
                                    <span>{claim.description || 'No description provided'}</span>
                                </div>
                            </div>
                            {claim.receipt && (
                                <div className="claim-receipt">
                                    <span className="claim-detail-label">Receipt</span>
                                    <span>{claim.receipt.fileName || claim.receipt.filePath || 'Receipt attached'}</span>
                                </div>
                            )}
                            {user?.role === 'ADMIN' && claim.status === 'PENDING' && (
                                <div className="claim-review-actions">
                                    <button
                                        className="claim-review-button claim-approve-button"
                                        type="button"
                                        disabled={reviewingClaimId !== '' || loading}
                                        onClick={() => reviewClaim(claim, 'approve')}
                                    >
                                        {reviewingClaimId === claim.id ? 'Reviewing...' : 'Approve'}
                                    </button>
                                    <button
                                        className="claim-review-button claim-reject-button"
                                        type="button"
                                        disabled={reviewingClaimId !== '' || loading}
                                        onClick={() => reviewClaim(claim, 'reject')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
