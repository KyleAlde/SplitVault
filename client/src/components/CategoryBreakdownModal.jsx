import './CategoryBreakdownModal.css';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatCurrency(value) {
    const amount = Number(value);
    return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

function getAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
}

export default function CategoryBreakdownModal({
    isOpen,
    onClose,
    poolName,
    totalBudget,
    categories = [],
}) {
    if (!isOpen) return null;

    const safeTotalBudget = getAmount(totalBudget);
    const totalSpent = categories.reduce((sum, category) => sum + getAmount(category.spent), 0);
    const totalRemaining = safeTotalBudget - totalSpent;

    return (
        <div className="category-breakdown-overlay" onClick={onClose}>
            <section
                className="category-breakdown-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="category-breakdown-title"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="category-breakdown-header">
                    <div>
                        <h2 id="category-breakdown-title">Category Breakdown</h2>
                        <p>{poolName || 'Budget pool'}</p>
                    </div>
                    <button
                        className="category-breakdown-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Close category breakdown"
                    >
                        &times;
                    </button>
                </header>

                <div className="category-breakdown-summary" aria-label="Pool budget summary">
                    <div className="category-breakdown-stat">
                        <span>Total Pool Budget</span>
                        <strong>{formatCurrency(safeTotalBudget)}</strong>
                    </div>
                    <div className="category-breakdown-stat">
                        <span>Total Spent</span>
                        <strong>{formatCurrency(totalSpent)}</strong>
                    </div>
                    <div className="category-breakdown-stat">
                        <span>Total Remaining</span>
                        <strong className={totalRemaining < 0 ? 'is-over-budget' : ''}>
                            {formatCurrency(totalRemaining)}
                        </strong>
                    </div>
                </div>

                <div className="category-breakdown-list">
                    {categories.length === 0 ? (
                        <div className="category-breakdown-empty">
                            <h3>No categories yet</h3>
                            <p>Categories added to this pool will appear here.</p>
                        </div>
                    ) : categories.map((category) => {
                        const allocated = getAmount(category.allocated);
                        const spent = getAmount(category.spent);
                        const remaining = allocated - spent;
                        const percentSpent = allocated > 0
                            ? Math.min(100, Math.round((spent / allocated) * 100))
                            : spent > 0 ? 100 : 0;
                        const isOverBudget = spent > allocated;
                        const barVariant = isOverBudget
                            ? 'danger'
                            : percentSpent >= 85 ? 'warning' : 'normal';

                        return (
                            <article className="category-breakdown-item" key={category.id || category.name}>
                                <div className="category-breakdown-item-heading">
                                    <div className="category-breakdown-name">
                                        <span
                                            className="category-breakdown-dot"
                                            style={{ '--category-color': category.color || 'var(--accent)' }}
                                            aria-hidden="true"
                                        />
                                        <h3>{category.name}</h3>
                                    </div>
                                    <span className={`category-breakdown-percent ${isOverBudget ? 'is-over-budget' : ''}`}>
                                        {isOverBudget ? 'Over budget' : `${percentSpent}% used`}
                                    </span>
                                </div>

                                <div
                                    className="category-breakdown-track"
                                    role="progressbar"
                                    aria-label={`${category.name} budget spent`}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={percentSpent}
                                >
                                    <span
                                        className={`category-breakdown-fill is-${barVariant}`}
                                        style={{
                                            width: `${percentSpent}%`,
                                            '--category-color': category.color || 'var(--accent)',
                                        }}
                                    />
                                </div>

                                <div className="category-breakdown-metrics">
                                    <div>
                                        <span>Allocated</span>
                                        <strong>{formatCurrency(allocated)}</strong>
                                    </div>
                                    <div>
                                        <span>Spent</span>
                                        <strong>{formatCurrency(spent)}</strong>
                                    </div>
                                    <div>
                                        <span>Remaining</span>
                                        <strong className={remaining < 0 ? 'is-over-budget' : ''}>
                                            {formatCurrency(remaining)}
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
