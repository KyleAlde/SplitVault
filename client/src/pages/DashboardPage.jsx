import { useState } from 'react';
import './DashboardPage.css';
import Header from '../common/Header';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ClaimsPanel from '../components/ClaimsPanel';
import ClaimForm from '../components/ClaimForm';

export default function DashboardPage({ dashboard, selectedPoolId, pools, user, onPoolChange, onClaimSubmitted, onClaimReviewed }) {
    const [isClaimFormOpen, setIsClaimFormOpen] = useState(false);
    const [claimsRefreshToken, setClaimsRefreshToken] = useState(0);
    const pool = dashboard && {
        totalBudget: dashboard.totalBudget,
        totalSpent: dashboard.totalSpent,
        categories: dashboard.categoryBreakdown,
    };

    function handleClaimSubmitted() {
        setClaimsRefreshToken((current) => current + 1);
        onClaimSubmitted();
    }

    return (
        <div className="dashboard-layout">
            <div className="main-pane">
                <Header
                    selectedPoolId={selectedPoolId}
                    pools={pools}
                    onPoolChange={onPoolChange}
                    onNewClaim={() => setIsClaimFormOpen(true)}
                />
                {!isClaimFormOpen && (
                    <div className="dashboard-welcome">
                        <div>
                            <span className="dashboard-eyebrow">Financial operations</span>
                            <h1>Dashboard overview</h1>
                            <p>Monitor your pool performance and manage expense claims.</p>
                        </div>
                    </div>
                )}
                {isClaimFormOpen && (
                    <ClaimForm
                        key={selectedPoolId}
                        poolId={selectedPoolId}
                        onSubmitted={handleClaimSubmitted}
                        onCancel={() => setIsClaimFormOpen(false)}
                    />
                )}
                <MetricsGrid pool={pool} />
                <DonutChart pool={pool} />
                <ClaimsPanel
                    poolId={selectedPoolId}
                    user={user}
                    refreshToken={claimsRefreshToken}
                    onClaimReviewed={onClaimReviewed}
                />
            </div>
        </div>
    );
}
