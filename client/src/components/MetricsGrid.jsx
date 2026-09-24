import React from 'react';
import './MetricsGrid.css';

export default function MetricsGrid({pool}) {
    const formatCurrency = (val) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(val);

    if (!pool) return null;

    const totalBudget = pool.totalBudget || 0;
    const totalSpent = pool.totalSpent || 0;
    const remainingBalance = totalBudget - totalSpent;
    const percentRemaining = totalBudget > 0 
        ? Math.round((remainingBalance / totalBudget) * 100) 
        : 0;

    return (
        <section className="metrics-grid">
            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Total Budget</span>
                </div>
                <div className="metric-value">{formatCurrency(totalBudget)}</div>
                <div className="metric-footer">
                    <span className="metric-subtext">Allocated pool limit</span>
                </div>
            </div>

            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Total Spent</span>
                </div>
                <div className="metric-value">{formatCurrency(totalSpent)}</div>
                <div className="metric-footer">
                    <span className="metric-subtext">Approved disbursements</span>
                </div>
            </div>

            <div className="metric-card metric-card-accent">
                <div className="metric-header">
                    <span className="metric-label">Remaining Balance</span>
                </div>
                <div className="metric-value accent">{formatCurrency(remainingBalance)}</div>
                <div className="metric-footer">
                    <span className="metric-subtext">Net liquid funds available</span>
                </div>
            </div>
        </section>
    )
}