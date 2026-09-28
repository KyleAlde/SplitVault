import React from 'react';

export default function FullLedgerModal({
    isOpen,
    onClose,
    modalClaims,
    approvedClaimsLength,
    categories,
    modalSearch,
    setModalSearch,
    modalCategory,
    setModalCategory,
    renderTableRows
}) {
    if (!isOpen) return null;

    return (
        <div className="ledger-modal-overlay" onClick={onClose}>
            <div className="ledger-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="ledger-modal-header">
                    <div>
                        <h2>Transaction Ledger</h2>
                        <p className="sub-text">Complete audit trail of all approved disbursements</p>
                    </div>
                    <button 
                        type="button" 
                        className="modal-close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-toolbar">
                    <input 
                        type="text" 
                        className="ledger-search" 
                        placeholder="Search description or claimant..." 
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                    />
                    <select 
                        className="ledger-select"
                        value={modalCategory}
                        onChange={(e) => setModalCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="modal-table-container">
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
                            {renderTableRows(modalClaims)}
                        </tbody>
                    </table>
                </div>

                <div className="modal-footer">
                    <span className="sub-text">Showing {modalClaims.length} of {approvedClaimsLength} claims</span>
                    <button 
                        type="button" 
                        className="btn-close-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}