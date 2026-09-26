import { useState } from 'react';
import './DashboardPage.css';
import { budgetPools } from '../tempData';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ActionCenter from '../components/ActionCenter';
import Ledger from '../components/Ledger';
import ReviewPendingModal from '../components/modals/ReviewPendingModal';

export default function DashboardPage({ selectedPoolId }) {
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [initialClaimId, setInitialClaimId] = useState(null);

    const activePool = budgetPools.find((p) => p.id === selectedPoolId) || budgetPools[0];

    const pendingClaims = activePool?.claims?.filter((claim) => claim.status === 'Pending') || [];

    const approvedClaims = activePool?.claims?.filter((claim) => claim.status === 'Approved') || [];

    const handleSubmitExpense = () => {
        console.log('Open Submit Expense Modal');
    };

    const handleReviewAllPending = () => {
        setInitialClaimId(null);
        setIsReviewModalOpen(true);
    };

    const handleReviewSingleClaim = (claimId) => {
        setInitialClaimId(claimId);
        setIsReviewModalOpen(true);
    };

    const handleViewClaimDetail = (claimId) => {
        console.log('Open Single Claim Detail Modal for ID:', claimId);
    };

    const handleViewAllLedger = () => {
        console.log('Navigate to Full Ledger Page / View');
    };

    const handleApprove = (claimId) => {
        console.log('Approved claim ID:', claimId);
        // TODO: Update claim status to Approved in state/backend
    };

    const handleReject = (claimId, reason) => {
        console.log('Rejected claim ID:', claimId, 'Reason:', reason);
        // TODO: Update claim status to Rejected/Revision in state/backend
    };

    return (
        <div className="dashboard-layout">
            <div className="main-pane">
                <MetricsGrid pool={activePool} />
                <DonutChart 
                    categories={activePool?.categories || []} 
                    totalBudget={activePool?.totalBudget || 0} 
                    totalSpent={activePool?.totalSpent || 0} 
                />
                <Ledger 
                    claims={activePool?.claims || []} 
                    categories={activePool?.categories || []} 
                />
            </div>
            <div className="action-center-sidebar">
                <ActionCenter 
                    claims={pendingClaims}
                    onReviewAll={handleReviewAllPending}
                    onSubmitExpense={handleSubmitExpense}
                    onReviewClaim={handleReviewSingleClaim}
                />
            </div>

            {/* Split-Pane Review Pending Modal Integration */}
            <ReviewPendingModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                pendingClaims={pendingClaims}
                categories={activePool?.categories || []}
                onApprove={handleApprove}
                onReject={handleReject}
                initialSelectedId={initialClaimId}
                activePoolName={activePool?.name}
            />
        </div>
    )
}