import './DonutChart.css';

export default function DonutChart({ pool }) {
	if (!pool || !pool.categories || pool.categories.length === 0) return null;

	const totalBudget = pool.totalBudget || 0;
	const totalSpent = pool.totalSpent || 0;
	const remainingBalance = Math.max(0, totalBudget - totalSpent);

	// Max value for total calculation (handles over-budget scenarios cleanly)
	const chartTotal = Math.max(totalBudget, totalSpent);

	const formatCurrency = (val) =>
		new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			maximumFractionDigits: 2,
		}).format(val);

	const radius = 60;
	const strokeWidth = 18;
	const circumference = 2 * Math.PI * radius;

	let accumulatedPercent = 0;

	// Build array of all chart slices (spent categories + remaining balance)
	const slices = [
		...pool.categories.map((cat) => ({
			name: cat.name,
			amount: cat.spent,
			color: cat.color,
			isRemaining: false,
		})),
	];

	// Append Remaining Balance segment as light grey if balance exists
	if (remainingBalance > 0) {
		slices.push({
			name: 'Remaining Balance',
			amount: remainingBalance,
			color: 'var(--border)',
			isRemaining: true,
		});
	}

	return (
		<section className="donut-card" aria-label="Category Expenditure Breakdown">
			<div className="donut-card-header">
				<h3>Category & Budget Breakdown</h3>
				<span className="donut-card-sub">Active Pool Allocation & Disbursements</span>
			</div>

			<div className="donut-card-body">
				{/* Donut Chart SVG */}
				<div className="donut-chart-container">
					<svg className="donut-svg" viewBox="0 0 160 160">
						{/* Background Track */}
						<circle
							cx="80"
							cy="80"
							r={radius}
							fill="transparent"
							stroke="var(--border)"
							strokeWidth={strokeWidth}
						/>

						{/* Dynamic Category & Remaining Slices */}
						{chartTotal > 0 &&
							slices.map((slice) => {
								if (slice.amount <= 0) return null;
								const percent = slice.amount / chartTotal;
								const strokeDasharray = `${percent * circumference} ${circumference}`;
								const strokeDashoffset = -accumulatedPercent * circumference;
								accumulatedPercent += percent;

								return (
									<circle
										key={slice.name}
										cx="80"
										cy="80"
										r={radius}
										fill="transparent"
										stroke={slice.color}
										strokeWidth={strokeWidth}
										strokeDasharray={strokeDasharray}
										strokeDashoffset={strokeDashoffset}
										className="donut-segment"
									/>
								);
							})}
					</svg>

					{/* Center Callout */}
					<div className="donut-center-info">
						<span className="donut-center-label">Total Budget</span>
						<span className="donut-center-value">{formatCurrency(totalBudget)}</span>
					</div>
				</div>

				{/* Legend List */}
				<div className="donut-legend">
					{slices.map((slice) => {
						const percent = chartTotal > 0 ? Math.round((slice.amount / chartTotal) * 100) : 0;
						return (
							<div
								key={slice.name}
								className={`legend-item ${slice.isRemaining ? 'legend-item-remaining' : ''}`}
							>
								<div className="legend-item-left">
									<span
										className="legend-color-dot"
										style={{ backgroundColor: slice.color }}
									/>
									<span className="legend-name">{slice.name}</span>
								</div>
								<div className="legend-item-right">
									<span className="legend-amount">{formatCurrency(slice.amount)}</span>
									<span className="legend-percent">{percent}%</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}