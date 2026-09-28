import { useEffect, useState } from 'react';
import './DashboardPage.css';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ActionCenter from '../components/ActionCenter';
import Ledger from '../components/Ledger';
import ReviewPendingModal from '../components/modals/ReviewPendingModal';
import SubmitExpenseModal from '../components/SubmitExpenseModal';
import { apiRequest } from '../api.js';

const STATUS_LABELS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' };

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : '—';
}

export default function DashboardPage({ token, selectedPoolId, userRole, poolRefreshKey }) {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [initialClaimId, setInitialClaimId] = useState(null);
    const [activePool, setActivePool] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isUpdatingClaim, setIsUpdatingClaim] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!selectedPoolId) {
            return undefined;
        }

        let cancelled = false;
        Promise.all([
            apiRequest(`/pools/${selectedPoolId}`, { token }),
            apiRequest(`/pools/${selectedPoolId}/dashboard`, { token }),
            apiRequest(`/pools/${selectedPoolId}/claims`, { token }),
        ]).then(([poolResponse, dashboard, claimsResponse]) => {
            if (cancelled) return;
            const categoryBreakdown = new Map(dashboard.categoryBreakdown.map((category) => [category.name, category]));
            const categories = poolResponse.pool.categories.map((category) => ({
                ...category,
                spent: categoryBreakdown.get(category.name)?.spent || 0,
            }));
            const claims = claimsResponse.claims.map((claim) => ({
                ...claim,
                status: STATUS_LABELS[claim.status] || claim.status,
                claimant: claim.claimant?.name || 'Unknown user',
                category: claim.category?.name || 'Uncategorized',
                date: formatDate(claim.incurredAt),
            }));
            setActivePool({ ...poolResponse.pool, ...dashboard, categories, claims });
            setLoadError(null);
        }).catch((error) => {
            if (!cancelled) setLoadError({
                poolId: selectedPoolId,
                message: error.message || 'Unable to load this budget pool.',
            });
        });

        return () => {
            cancelled = true;
        };
    }, [selectedPoolId, token, reloadKey, poolRefreshKey]);

    const displayedPool = activePool?.id === selectedPoolId ? activePool : null;
    const displayedError = loadError?.poolId === selectedPoolId ? loadError.message : '';
    const isAdmin = userRole === 'ADMIN';
    const pendingClaims = displayedPool?.claims?.filter((claim) => claim.status === 'Pending') || [];
    const handleSubmitExpense = () => setIsSubmitModalOpen(true);

    const handleReviewAllPending = () => {
        setInitialClaimId(null);
        setIsReviewModalOpen(true);
    };

    const handleReviewSingleClaim = (claimId) => {
        setInitialClaimId(claimId);
        setIsReviewModalOpen(true);
    };

    const handleReview = async (claimId, decision, reviewNote) => {
        setActionError('');
        setIsUpdatingClaim(true);
        try {
            await apiRequest(`/claims/${claimId}/${decision}`, {
                token,
                method: 'POST',
                body: reviewNote ? { reviewNote } : {},
            });
            setReloadKey((key) => key + 1);
            return true;
        } catch (error) {
            setActionError(error.message || 'Unable to update this claim.');
            return false;
        } finally {
            setIsUpdatingClaim(false);
        }
    };

    const handleSubmitClaim = async (formData) => {
        if (!selectedPoolId) {
            throw new Error('Select a budget pool before submitting an expense claim.');
        }
        await apiRequest(`/pools/${selectedPoolId}/claims`, {
            token,
            method: 'POST',
            body: formData,
        });
        setIsSubmitModalOpen(false);
        setReloadKey((key) => key + 1);
    };

    if (!selectedPoolId) return <div className="dashboard-message">No budget pools are available for this account.</div>;
    if (!displayedPool && !displayedError) return <div className="dashboard-message">Loading budget pool...</div>;

    return (
        <div className="dashboard-layout">
            {(displayedError || actionError) && <div className="dashboard-error" role="alert">{actionError || displayedError}</div>}
            {displayedPool && <>
                <div className="main-pane">
                    <MetricsGrid pool={displayedPool} />
                    <DonutChart
                        categories={displayedPool.categories || []}
                        totalBudget={displayedPool.totalBudget || 0}
                        totalSpent={displayedPool.totalSpent || 0}
                    />
                    <Ledger claims={displayedPool.claims || []} categories={displayedPool.categories || []} />
                </div>
                <div className="action-center-sidebar">
                    <ActionCenter
                        claims={pendingClaims}
                        canReview={isAdmin}
                        onReviewAll={handleReviewAllPending}
                        onSubmitExpense={handleSubmitExpense}
                        onReviewClaim={handleReviewSingleClaim}
                    />
                </div>
            </>}

            {isAdmin && isReviewModalOpen && <ReviewPendingModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                pendingClaims={pendingClaims}
                categories={displayedPool?.categories || []}
                onApprove={(claimId) => handleReview(claimId, 'approve')}
                onReject={(claimId, reason) => handleReview(claimId, 'reject', reason)}
                initialSelectedId={initialClaimId}
                activePoolName={displayedPool?.name}
                isUpdating={isUpdatingClaim}
                errorMessage={actionError}
            />}
            <SubmitExpenseModal
                key={selectedPoolId}
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                poolId={selectedPoolId}
                categories={displayedPool?.categories || []}
                remainingBalance={displayedPool?.remainingBalance}
                onSubmit={handleSubmitClaim}
            />
        </div>
    )
}