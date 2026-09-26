import React, { useState, useMemo } from 'react';
import FullLedgerModal from './FullLedgerModal';
import './Ledger.css';

export default function Ledger({ claims = [], categories = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal-specific filters
    const [modalSearch, setModalSearch] = useState('');
    const [modalCategory, setModalCategory] = useState('All');

    const getCategoryColor = (categoryName) => {
        return categories.find((cat) => cat.name === categoryName)?.color || 'var(--text)';
    };

    const approvedClaims = useMemo(() => {
        return claims.filter((claim) => claim.status === 'Approved');
    }, [claims]);

    // Inline view data (top 5 matching quick search)
    const inlineClaims = useMemo(() => {
        return approvedClaims
            .filter((claim) => 
                claim.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                claim.claimant.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 5);
    }, [approvedClaims, searchTerm]);

    // Modal view data (fully filtered by search and category)
    const modalClaims = useMemo(() => {
        return approvedClaims.filter((claim) => {
            const matchesSearch = 
                claim.title.toLowerCase().includes(modalSearch.toLowerCase()) || 
                claim.claimant.toLowerCase().includes(modalSearch.toLowerCase());
            const matchesCategory = modalCategory === 'All' || claim.category === modalCategory;
            return matchesSearch && matchesCategory;
        });
    }, [approvedClaims, modalSearch, modalCategory]);

    // Reusable table body rows helper to keep code DRY
    const renderTableRows = (claimsList) => {
        if (claimsList.length === 0) {
            return (
                <tr>
                    <td colSpan="5" className="empty-state-cell">
                        No transactions match your criteria.
                    </td>
                </tr>
            );
        }

        return claimsList.map((claim) => (
            <tr key={claim.id}>
                <td className="col-title">{claim.title}</td>
                <td className="col-claimant">{claim.claimant}</td>
                <td>
                    <span className="category-pill">
                        <span 
                            className="cat-dot" 
                            style={{ backgroundColor: getCategoryColor(claim.category) }}
                        ></span>
                        {claim.category}
                    </span>
                </td>
                <td className="text-right col-amount">
                    ₱{Number(claim.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right col-date">{claim.date}</td>
            </tr>
        ));
    };

    return (
        <>
            {/* Inline Dashboard Card */}
            <div className="ledger-card">
                <div className="ledger-header">
                    <div className="header-titles">
                        <h3>Transaction Ledger</h3>
                        <span className="sub-text">Recent approved and settled disbursements</span>
                    </div>
                    <div className="ledger-controls">
                        <input 
                            type="text" 
                            className="ledger-search" 
                            placeholder="Quick search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Claimant</th>
                                <th>Category</th>
                                <th className="text-right">Amount</th>
                                <th className="text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows(inlineClaims)}
                        </tbody>
                    </table>
                </div>

                {approvedClaims.length > 5 && (
                    <div className="card-footer-centered">
                        <button 
                            type="button" 
                            className="btn-view-all-ledger"
                            onClick={() => setIsModalOpen(true)}
                        >
                            View All Approved Transactions ({approvedClaims.length}) →
                        </button>
                    </div>
                )}
            </div>

            {/* Full Audit Modal Component */}
            <FullLedgerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                modalClaims={modalClaims}
                approvedClaimsLength={approvedClaims.length}
                categories={categories}
                modalSearch={modalSearch}
                setModalSearch={setModalSearch}
                modalCategory={modalCategory}
                setModalCategory={setModalCategory}
                renderTableRows={renderTableRows}
            />
        </>
    );
}