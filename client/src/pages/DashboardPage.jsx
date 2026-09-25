import { useState } from 'react';
import './DashboardPage.css';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ClaimsPanel from '../components/ClaimsPanel';
import ClaimForm from '../components/ClaimForm';

export default function DashboardPage({ dashboard, selectedPoolId, onClaimSubmitted }) {
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
                {!isClaimFormOpen && (
                    <div className="dashboard-actions">
                        <button className="new-claim-button" type="button" onClick={() => setIsClaimFormOpen(true)}>
                            + New Claim
                        </button>
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
                <ClaimsPanel poolId={selectedPoolId} refreshToken={claimsRefreshToken} />
            </div>
            <div className="action-center-sidebar" />
        </div>
    );
}
