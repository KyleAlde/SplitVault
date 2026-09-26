import './DashboardPage.css';
import { budgetPools } from '../tempData';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';
import ActionCenter from '../components/ActionCenter';

export default function DashboardPage({ selectedPoolId }) {
    const activePool = budgetPools.find((p) => p.id === selectedPoolId) || budgetPools[0];

    const pendingClaims = activePool?.claims?.filter((claim) => claim.status === 'Pending') || [];

    return (
        <div className="dashboard-layout">
            <div className="main-pane">
                <MetricsGrid pool={activePool} />
                <DonutChart 
                    categories={activePool?.categories || []} 
                    totalBudget={activePool?.totalBudget || 0} 
                    totalSpent={activePool?.totalSpent || 0} 
                />
            </div>
            <div className="action-center-sidebar">
                <ActionCenter claims={pendingClaims}/>
            </div>
        </div>
    )
}