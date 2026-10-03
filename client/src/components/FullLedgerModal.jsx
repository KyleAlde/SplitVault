import { useMemo, useState } from 'react';

const SORT_FIELDS = [
    { key: 'title', label: 'Description' },
    { key: 'claimant', label: 'Claimant' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
];

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
    renderTableRows,
}) {
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const sortedClaims = useMemo(() => {
        const getValue = (claim) => {
            if (sort.key === 'amount') return Number(claim.amount) || 0;
            if (sort.key === 'date') return new Date(claim.incurredAt || claim.date).getTime() || 0;
            return String(claim[sort.key] || '').toLocaleLowerCase();
        };

        return modalClaims
            .map((claim, index) => ({ claim, index }))
            .sort((first, second) => {
                const firstValue = getValue(first.claim);
                const secondValue = getValue(second.claim);
                const comparison = typeof firstValue === 'number'
                    ? firstValue - secondValue
                    : firstValue.localeCompare(secondValue);

                return comparison === 0
                    ? first.index - second.index
                    : comparison * (sort.direction === 'asc' ? 1 : -1);
            })
            .map(({ claim }) => claim);
    }, [modalClaims, sort]);

    const handleSort = (key) => {
        setSort((currentSort) => ({
            key,
            direction: currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

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
                                {SORT_FIELDS.map(({ key, label }) => (
                                    <th
                                        key={key}
                                        className={key === 'amount' || key === 'date' ? 'text-right' : undefined}
                                        aria-sort={sort.key === key
                                            ? sort.direction === 'asc' ? 'ascending' : 'descending'
                                            : 'none'}
                                    >
                                        <button
                                            type="button"
                                            className="ledger-sort-button"
                                            aria-label={`Sort by ${label}`}
                                            aria-pressed={sort.key === key}
                                            onClick={() => handleSort(key)}
                                        >
                                            {label}{sort.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows(sortedClaims)}
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