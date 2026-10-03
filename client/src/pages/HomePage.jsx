import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinPoolModal from '../components/JoinPoolModal';
import CreatePoolModal from '../components/CreatePoolModal';
import SuccessModal from '../components/SuccessModal';
import './HomePage.css';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('PHP', '₱');
};

const getOrganizationName = (user) => {
    const directName = user?.organizationName || user?.orgName || user?.organization;
    if (directName && String(directName).trim()) {
        return String(directName).trim();
    }

    const emailDomain = user?.email?.split('@')?.[1];
    if (emailDomain) {
        const fallback = emailDomain.split('.')[0].replace(/[-_]/g, ' ');
        if (fallback) {
            return fallback.replace(/\b\w/g, (letter) => letter.toUpperCase());
        }
    }

    return 'Your Organization';
};

export default function HomePage({ token, currentUser, pools = [], onRefresh, onLogout }) {
    const navigate = useNavigate();
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateSuccessOpen, setIsCreateSuccessOpen] = useState(false);

    if (!currentUser) {
        return <div className="app-loading">Loading your Vault dashboard...</div>;
    }

    const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';
    const orgName = getOrganizationName(currentUser);

    return (
        <div className="home-layout">
            <div className="patterned-bg" />

            <div className="content-wrapper">
                {/* Hero Banner */}
                <section className="hero-section">
                    <div className="hero-text-group">
                        <div className="hero-badge-row">
                            <span className="hero-badge">Computer Science Society</span>
                            <span className="badge-dot">•</span>
                            <span className="hero-status">Active Session</span>
                        </div>
                        <h1 className="hero-title">
                            Welcome to your Vault, {firstName}
                        </h1>
                        <p className="hero-subtitle">
                            {pools.length > 0 
                                ? `Managing ${pools.length} active budget pool${pools.length > 1 ? 's' : ''} with real-time expense monitoring`
                                : `No active pool assignments • Join or establish a new pool to get started`}
                        </p>
                    </div>
                </section>

                <main className="main-content">
                    {/* Budget Pools Section */}
                    <section className="budget-pools-section">
                        <div className="section-header">
                            <h2>Your Budget Pools</h2>
                            <span className="count-badge">{pools.length}</span>
                        </div>

                        {pools.length === 0 ? (
                            <div className="pools-grid">
                                <div className="dashboard-card empty-state">
                                    <div className="empty-icon-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <h3>No Active Budget Pools</h3>
                                    <p>You are not assigned to any budget pools yet.</p>
                                </div>

                                <div className="dashboard-card create-card" onClick={() => setIsCreateModalOpen(true)}>
                                    <div className="create-icon-plus">+</div>
                                    <h4>Create New Budget Pool</h4>
                                    <p>Set up allocations and invite contributors.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="pools-grid">
                                {pools.map((pool) => {
                                    const spentPercentage = pool.totalBudget > 0 
                                        ? Math.min(100, (pool.totalSpent / pool.totalBudget) * 100)
                                        : 0;
                                    const remaining = pool.totalBudget - pool.totalSpent;
                                    const hasAlerts = pool.pendingApprovalsCount > 0;

                                    return (
                                        <div 
                                            key={pool.id} 
                                            className="dashboard-card pool-card"
                                            onClick={() => navigate(`/pool/${pool.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="card-top-row">
                                                <span className="pool-id-tag">{pool.id.slice(0, 8)}</span>
                                                <span className={`status-badge ${hasAlerts ? 'status-pending' : 'status-normal'}`}>
                                                    {hasAlerts ? `⚠️ ${pool.pendingApprovalsCount} Pending` : 'Up to Date'}
                                                </span>
                                            </div>

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
                                                                    : 'linear-gradient(90deg, #4f46e5, #06b6d4)'
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
                                                        <p className="metric-num text-brand">{formatCurrency(remaining)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="dashboard-card create-card" onClick={() => setIsCreateModalOpen(true)}>
                                    <div className="create-icon-plus">+</div>
                                    <h4>Create New Budget Pool</h4>
                                    <p>Set up allocations and invite contributors.</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Join Pool Action Banner */}
                    <section className="join-pool-section">
                        <div className="dashboard-card join-banner-card">
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
                            <button className="btn-primary" onClick={() => setIsJoinModalOpen(true)}>
                                Enter Pool ID
                            </button>
                        </div>
                    </section>
                </main>

                <footer className="home-footer">
                    <button type="button" className="home-logout-button" onClick={onLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10 17l5-5-5-5" />
                            <path d="M15 12H3" />
                            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                        </svg>
                        Log Out
                    </button>
                </footer>
            </div>

            <JoinPoolModal 
                isOpen={isJoinModalOpen} 
                token={token}
                onClose={() => {
                    setIsJoinModalOpen(false);
                    onRefresh?.();
                }} 
            />

            <CreatePoolModal
                isOpen={isCreateModalOpen}
                token={token}
                onClose={() => setIsCreateModalOpen(false)}
                onPoolCreated={() => {
                    setIsCreateModalOpen(false);
                    setIsCreateSuccessOpen(true);
                    onRefresh?.();
                }}
            />
            {isCreateSuccessOpen && (
                <SuccessModal
                    title="Budget pool created"
                    message="Your budget pool has been created successfully."
                    onClose={() => setIsCreateSuccessOpen(false)}
                />
            )}
        </div>
    );
}