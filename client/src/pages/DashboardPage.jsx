import './DashboardPage.css';
import { budgetPools } from '../tempData';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ActionCenter from '../components/ActionCenter';
import Ledger from '../components/Ledger';

export default function DashboardPage({ selectedPoolId }) {
    const activePool = budgetPools.find((p) => p.id === selectedPoolId) || budgetPools[0];

    const pendingClaims = activePool?.claims?.filter((claim) => claim.status === 'Pending') || [];

    const approvedClaims = activePool?.claims?.filter((claim) => claim.status === 'Approved') || [];

    const handleSubmitExpense = () => {
		console.log('Open Submit Expense Modal');
	};

	const handleReviewAllPending = () => {
		console.log('Open Pending Claims Split-Pane Modal');
	};

	const handleViewClaimDetail = (claimId) => {
		console.log('Open Single Claim Detail Modal for ID:', claimId);
	};

	const handleViewAllLedger = () => {
		console.log('Navigate to Full Ledger Page / View');
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
                <ActionCenter claims={pendingClaims}/>
            </div>
        </div>
    )
}