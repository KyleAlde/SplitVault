import { useState } from 'react';
import { apiRequest, getApiErrorMessage } from '../api.js';

function toCents(value) {
    return Math.round(Number(value) * 100);
}

function formatPHP(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(value);
}

export default function EditCategoryModal({
    token,
    poolId,
    category,
    totalSpent,
    unallocatedReserve,
    onClose,
    onUpdated,
}) {
    const [name, setName] = useState(category.name);
    const [budget, setBudget] = useState(String(category.budget));
    const [color, setColor] = useState(category.color || '#425b9a');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const parsedBudget = Number(budget);
    const budgetValid = budget !== '' && Number.isFinite(parsedBudget) && parsedBudget > 0;
    const oldBudgetCents = toCents(category.budget);
    const newBudgetCents = budgetValid ? toCents(parsedBudget) : 0;
    const unallocatedReserveCents = toCents(unallocatedReserve);
    const totalSpentCents = toCents(totalSpent);
    const exceedsReserve = budgetValid
        && newBudgetCents > oldBudgetCents
        && newBudgetCents - oldBudgetCents > unallocatedReserveCents;
    const belowSpent = budgetValid
        && newBudgetCents < oldBudgetCents
        && newBudgetCents < totalSpentCents;
    const nameError = name.trim() ? '' : 'Category name cannot be empty.';
    const budgetError = !budgetValid ? 'Enter a category budget greater than ₱0.00.' : '';
    const reserveError = exceedsReserve
        ? `Increase exceeds unallocated reserve (Max allowed: ${formatPHP((oldBudgetCents + unallocatedReserveCents) / 100)})`
        : '';
    const spentError = belowSpent
        ? `Cannot lower budget below current category spending (${formatPHP(totalSpentCents / 100)})`
        : '';

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (nameError || budgetError || reserveError || spentError) return;

        setIsSaving(true);
        try {
            const response = await apiRequest(`/pools/${poolId}/categories/${category.id}`, {
                token,
                method: 'PATCH',
                body: { name: name.trim(), budget: parsedBudget, color },
            });
            onUpdated(response.category);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Unable to update this category.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="edit-category-overlay" onClick={onClose}>
            <form className="edit-category-modal" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
                <div className="edit-category-header">
                    <div>
                        <h2>Edit Category</h2>
                        <p>Update the category allocation within the pool's available reserve.</p>
                    </div>
                    <button type="button" className="edit-category-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                {error && <div className="edit-category-error" role="alert">{error}</div>}
                <label className="settings-field">
                    Category name
                    <input value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(nameError)} required />
                    {nameError && <span className="settings-field-error" role="alert">{nameError}</span>}
                </label>
                <label className="settings-field">
                    Category budget (PHP)
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        aria-invalid={Boolean(budgetError || reserveError || spentError)}
                        required
                    />
                    <span className="settings-field-hint">Current category spending: {formatPHP(totalSpentCents / 100)}</span>
                    {budgetError && <span className="settings-field-error" role="alert">{budgetError}</span>}
                    {reserveError && <span className="settings-field-error" role="alert">{reserveError}</span>}
                    {spentError && <span className="settings-field-error" role="alert">{spentError}</span>}
                </label>
                <label className="settings-field">
                    Color
                    <input className="settings-color-input" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
                </label>
                <div className="edit-category-actions">
                    <button type="button" className="settings-cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        type="submit"
                        className="settings-save-btn"
                        disabled={isSaving || Boolean(nameError || budgetError || reserveError || spentError)}
                    >
                        {isSaving ? 'Saving...' : 'Save category'}
                    </button>
                </div>
            </form>
        </div>
    );
}
