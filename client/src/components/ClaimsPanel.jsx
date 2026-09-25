import { useEffect, useState } from 'react';
import { getClaims } from '../api';
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

export default function ClaimsPanel({ poolId, refreshToken = 0 }) {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        if (!poolId) {
            return () => {
                active = false;
            };
        }

        Promise.resolve().then(() => {
            if (!active) return;
            setLoading(true);
            setError('');
            return getClaims(poolId)
                .then(({ claims: nextClaims }) => {
                    if (active) setClaims(nextClaims);
                })
                .catch((requestError) => {
                    if (active) {
                        setClaims([]);
                        setError(requestError.message);
                    }
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        });

        return () => {
            active = false;
        };
    }, [poolId, refreshToken]);

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
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
