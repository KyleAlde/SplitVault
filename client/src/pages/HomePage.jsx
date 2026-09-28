import React, { useState } from 'react';
import JoinPoolModal from '../components/JoinPoolModal';
import { currentUser, budgetPools } from '../tempData';
import './HomePage.css';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('PHP', '₱');
};

export default function HomePage({ token }) {
    const [pools, setPools] = useState(budgetPools);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const totalMonitoredFunds = pools.reduce((sum, pool) => sum + pool.totalBudget, 0);
    const totalSpentFunds = pools.reduce((sum, pool) => sum + pool.totalSpent, 0);
    const availableBalance = totalMonitoredFunds - totalSpentFunds;

    return (
        <div className="home-layout">
            {/* Background Gradient, Ambient Green Auras & Hex Pattern */}
            <div className="patterned-bg">
                <div className="aura-glow aura-brand"></div>
                <div className="aura-glow aura-emerald"></div>
                <div className="aura-glow aura-mint"></div>
                <div className="hex-pattern"></div>
            </div>

            <div className="content-wrapper">
                {/* Header with Orbitron Typography */}
                <header className="hero-section">
                    <div className="hero-text-group">
                        <div className="hero-badge-row">
                            <span className="hero-badge">{currentUser.orgName.toUpperCase()} VAULT</span>
                            <span className="badge-dot">•</span>
                            <span className="hero-status">Active Session</span>
                        </div>
                        <h1 className="hero-title">
                            Welcome back, {currentUser.firstName} 👋
                        </h1>
                        <p className="hero-subtitle">
                            {pools.length > 0 
                                ? `Managing ${pools.length} active budget pool${pools.length > 1 ? 's' : ''} with real-time expense monitoring`
                                : `No active pool assignments • Join or establish a new pool to get started`}
                        </p>
                    </div>

                    <div className="light-card hero-metrics-card">
                        <div className="metric-block">
                            <span className="metric-label">Monitored Funds</span>
                            <span className="metric-value text-slate">{formatCurrency(totalMonitoredFunds)}</span>
                        </div>
                        <div className="metric-divider"></div>
                        <div className="metric-block">
                            <span className="metric-label">Available Balance</span>
                            <span className="metric-value text-emerald">{formatCurrency(availableBalance)}</span>
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    {/* Budget Pools Section */}
                    <section className="budget-pools-section">
                        <div className="section-header">
                            <h2>Your Budget Pools</h2>
                            <span className="count-badge">{pools.length}</span>
                        </div>

                        {pools.length === 0 ? (
                            <div className="light-card empty-state">
                                <div className="empty-icon-wrapper">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3>No Active Budget Pools</h3>
                                <p>You are not assigned to any budget pools yet. Enter a Pool ID to request access.</p>
                                <button className="btn-primary" onClick={() => setIsJoinModalOpen(true)}>
                                    Join Existing Pool
                                </button>
                            </div>
                        ) : (
                            <div className="pools-grid">
                                {pools.map((pool, idx) => {
                                    const spentPercentage = Math.min(100, (pool.totalSpent / pool.totalBudget) * 100);
                                    const remaining = pool.totalBudget - pool.totalSpent;
                                    const hasAlerts = pool.pendingApprovalsCount > 0;
                                    
                                    // Accent variants based on primary brand & subtle green tones
                                    const headerVariants = ['header-brand', 'header-emerald', 'header-teal'];
                                    const variantClass = headerVariants[idx % headerVariants.length];

                                    return (
                                        <div key={pool.id} className="light-card pool-card">
                                            {/* Dual-zone visual window top header */}
                                            <div className={`card-visual-header ${variantClass}`}>
                                                <div className="window-dots">
                                                    <span className="dot dot-red"></span>
                                                    <span className="dot dot-amber"></span>
                                                    <span className="dot dot-green"></span>
                                                    <span className="window-label">{pool.id}</span>
                                                </div>
                                                <span className={`category-tag ${hasAlerts ? 'tag-warning' : 'tag-normal'}`}>
                                                    {hasAlerts ? `⚠️ ${pool.pendingApprovalsCount} Pending` : 'Up to Date'}
                                                </span>
                                            </div>

                                            {/* Crisp White Card Body */}
                                            <div className="card-body">
                                                <h3 className="pool-title">{pool.name}</h3>
                                                
                                                <div className="progress-container">
                                                    <div className="progress-label-row">
                                                        <span className="progress-pct">{spentPercentage.toFixed(0)}% Allocated</span>
                                                    </div>
                                                    <div className="progress-bar-bg">
                                                        <div 
                                                            className="progress-bar-fill" 
                                                            style={{ 
                                                                width: `${spentPercentage}%`,
                                                                background: spentPercentage > 85 
                                                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                                                                    : 'linear-gradient(90deg, #425B9A, #10b981)'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pool-metrics">
                                                    <div>
                                                        <span className="metric-caption">Spent</span>
                                                        <p className="metric-num">{formatCurrency(pool.totalSpent)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="metric-caption">Remaining</span>
                                                        <p className="metric-num text-emerald">{formatCurrency(remaining)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="light-card create-card" onClick={() => setIsJoinModalOpen(true)}>
                                    <div className="create-icon-plus">+</div>
                                    <h4>Establish New Pool</h4>
                                    <p>Set up allocations and invite contributors.</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Join Banner */}
                    <section className="join-pool-section">
                        <div className="light-card join-banner-card">
                            <div className="join-banner-info">
                                <div className="key-icon-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="8" cy="15" r="4" />
                                        <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Have a Pool Access Key?</h3>
                                    <p>Enter a unique Pool ID provided by your administrator to request access.</p>
                                </div>
                            </div>
                            <button className="btn-brand" onClick={() => setIsJoinModalOpen(true)}>
                                Enter Pool ID
                            </button>
                        </div>
                    </section>
                </main>
            </div>

            <JoinPoolModal 
                isOpen={isJoinModalOpen} 
                onClose={() => setIsJoinModalOpen(false)} 
            />
        </div>
    );
}