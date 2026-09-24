import './DashboardPage.css';
import { budgetPools } from '../tempData';
import MetricsGrid from '../components/MetricsGrid';
import DonutChart from '../components/DonutChart';

export default function DashboardPage({ selectedPoolId }) {
    const activePool = budgetPools.find((p) => p.id === selectedPoolId) || budgetPools[0];

    return (
        <div className="dashboard-layout">
            <div className="main-pane">
                <MetricsGrid pool={activePool} />
                <DonutChart pool={activePool} />
            </div>
            <div className="action-center-sidebar">
                
            </div>
        </div>
    )
}