import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './DashboardPage.css';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ActionCenter from '../components/ActionCenter';
import Ledger from '../components/Ledger';
import ReviewPendingModal from '../components/modals/ReviewPendingModal';
import SubmitExpenseModal from '../components/SubmitExpenseModal';
import SuccessModal from '../components/SuccessModal';
import CategoryBreakdownModal from '../components/CategoryBreakdownModal';
import { apiRequest, getApiErrorMessage } from '../api.js';

const STATUS_LABELS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' };

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : '—';
}

export default function DashboardPage({
    token,
    selectedPoolId,
    userRole,
    poolRefreshKey,
    openReviewPoolId,
    onReviewOpened,
}) {
    const { poolId: urlPoolId } = useParams();
    const effectivePoolId = urlPoolId || selectedPoolId;

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isCategoryBreakdownOpen, setIsCategoryBreakdownOpen] = useState(false);
    const [initialClaimId, setInitialClaimId] = useState(null);
    const [activePool, setActivePool] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isUpdatingClaim, setIsUpdatingClaim] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (!effectivePoolId) {
            return undefined;
        }

        let cancelled = false;
        Promise.all([
            apiRequest(`/pools/${effectivePoolId}`, { token }),
            apiRequest(`/pools/${effectivePoolId}/dashboard`, { token }),
            apiRequest(`/pools/${effectivePoolId}/claims`, { token }),
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
                poolId: effectivePoolId,
                message: error.message || 'Unable to load this budget pool.',
            });
        });

        return () => {
            cancelled = true;
        };
    }, [effectivePoolId, token, reloadKey, poolRefreshKey]);

    const displayedPool = activePool?.id === effectivePoolId ? activePool : null;
    const displayedError = loadError?.poolId === effectivePoolId ? loadError.message : '';
    const isAdmin = userRole === 'ADMIN';
    const isNotificationReviewOpen = openReviewPoolId === effectivePoolId;
    const isReviewModalVisible = isReviewModalOpen || isNotificationReviewOpen;
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
            if (decision === 'approve') {
                setSuccess({
                    title: 'Expense claim approved',
                    message: 'The expense claim has been approved successfully.',
                });
                setIsReviewModalOpen(false);
                if (isNotificationReviewOpen) onReviewOpened?.();
            }
            return true;
        } catch (error) {
            setActionError(getApiErrorMessage(error, 'Unable to update this claim.'));
            return false;
        } finally {
            setIsUpdatingClaim(false);
        }
    };

    const handleSubmitClaim = async (formData) => {
        if (!effectivePoolId) {
            throw new Error('Select a budget pool before submitting an expense claim.');
        }
        await apiRequest(`/pools/${effectivePoolId}/claims`, {
            token,
            method: 'POST',
            body: formData,
        });
        setIsSubmitModalOpen(false);
        setSuccess({
            title: 'Expense claim submitted',
            message: 'Your expense claim has been submitted successfully and is pending review.',
        });
        setReloadKey((key) => key + 1);
    };

    if (!effectivePoolId) return <div className="dashboard-message">No budget pools are available for this account.</div>;
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
                        onViewCategoryDetails={() => setIsCategoryBreakdownOpen(true)}
                    />
                    <Ledger
                        claims={displayedPool.claims || []}
                        categories={displayedPool.categories || []}
                        activePoolName={displayedPool.name}
                    />
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

            {isAdmin && isReviewModalVisible && <ReviewPendingModal
                isOpen={isReviewModalVisible}
                onClose={() => {
                    setIsReviewModalOpen(false);
                    if (isNotificationReviewOpen) onReviewOpened();
                }}
                pendingClaims={pendingClaims}
                categories={displayedPool?.categories || []}
                onApprove={(claimId) => handleReview(claimId, 'approve')}
                onReject={(claimId, reason) => handleReview(claimId, 'reject', reason)}
                initialSelectedId={isNotificationReviewOpen ? null : initialClaimId}
                activePoolName={displayedPool?.name}
                isUpdating={isUpdatingClaim}
                errorMessage={actionError}
            />}
            <SubmitExpenseModal
                key={effectivePoolId}
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                poolId={effectivePoolId}
                categories={displayedPool?.categories || []}
                remainingBalance={displayedPool?.remainingBalance}
                onSubmit={handleSubmitClaim}
            />
            <CategoryBreakdownModal
                isOpen={isCategoryBreakdownOpen}
                onClose={() => setIsCategoryBreakdownOpen(false)}
                poolName={displayedPool?.name || ''}
                totalBudget={displayedPool?.totalBudget || 0}
                categories={(displayedPool?.categories || []).map((category) => ({
                    id: category.id,
                    name: category.name,
                    allocated: category.budget,
                    spent: category.totalSpent ?? category.spent ?? 0,
                    color: category.color,
                }))}
            />
            {success && (
                <SuccessModal
                    title={success.title}
                    message={success.message}
                    onClose={() => setSuccess(null)}
                />
            )}
        </div>
    );
}