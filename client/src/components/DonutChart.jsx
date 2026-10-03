import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import './DonutChart.css';

export default function DonutChart({
	categories = [],
	totalBudget = 0,
	totalSpent = 0,
	onViewCategoryDetails,
}) {
	const remainingBalance = Math.max(0, totalBudget - totalSpent);

	const chartData = [
		...categories.map((cat) => {
			const val = Number(cat.spent || cat.amount || 0); 
			return {
				name: cat.name || 'Unknown',
				value: val,
				color: cat.color || '#cbd5e1',
				percentage: totalBudget > 0 ? Math.round((val / totalBudget) * 100) : 0,
				isRemaining: false
			};
		}),
		{ 
			name: 'Remaining Balance', 
			value: remainingBalance, 
			color: '#e2e8f0', 
			percentage: totalBudget > 0 ? Math.round((remainingBalance / totalBudget) * 100) : 0,
			isRemaining: true 
		},
	];

	const percentRemaining = totalBudget > 0 
		? Math.round((remainingBalance / totalBudget) * 100) 
		: 0;

	return (
		<div className="donut-card">
			<div className="donut-card-header">
				<div className="card-header">
					<h3>Category & Budget Breakdown</h3>
					<span className="sub-text">Active Pool Allocation & Disbursements</span>
				</div>
				{onViewCategoryDetails && (
					<button
						type="button"
						className="btn-view-all-ledger category-details-button"
						onClick={onViewCategoryDetails}
					>
						View Category Details
					</button>
				)}
			</div>

			<div className="chart-body">
				<div className="chart-container">
					<PieChart width={220} height={220}>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							innerRadius={65}
							outerRadius={85}
							paddingAngle={3}
							startAngle={90}
							endAngle={-270}
							dataKey="value"
						>
							{chartData.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
							))}
						</Pie>
						<Tooltip
							formatter={(value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
							contentStyle={{
								backgroundColor: 'var(--code-bg, #1e293b)',
								borderColor: 'var(--border, #334155)',
								borderRadius: '8px',
								color: 'var(--text-h, #ffffff)',
								fontSize: '12px',
							}}
						/>
					</PieChart>

					<div className="donut-center-info">
						<span className="donut-percent">{percentRemaining}%</span>
					</div>
				</div>

				<ul className="category-legend">
					{chartData.map((item, idx) => (
						<li 
							key={idx} 
							className={`legend-item ${item.isRemaining ? 'legend-transparent' : 'legend-filled'}`}
						>
							<div className="legend-left">
								<span className="legend-dot" style={{ backgroundColor: item.color }} />
								<span className="legend-name">{item.name}</span>
							</div>
							<div className="legend-right">
								<span className="legend-val">
									₱{Number(item.value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
								</span>
								<span className="legend-pct">{item.percentage}%</span>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}