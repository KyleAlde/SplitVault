import React, { useState } from 'react';
import { apiRequest } from '../api.js';
import './CreatePoolModal.css';

export default function CreatePoolModal({ isOpen, onClose, token, onPoolCreated }) {
    // Pool details state
    const [newPoolName, setNewPoolName] = useState('');
    const [newPoolDescription, setNewPoolDescription] = useState('');
    const [newPoolBudget, setNewPoolBudget] = useState('');

    // Category form state
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [categoryNameError, setCategoryNameError] = useState('');
    const [categoryBudget, setCategoryBudget] = useState('');
    const [categoryBudgetError, setCategoryBudgetError] = useState('');
    const [categoryColor, setCategoryColor] = useState('#176b5b');

    // Modal state
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAddCategory = (event) => {
        event.preventDefault();
        event.stopPropagation();

        let hasError = false;

        if (!categoryName.trim()) {
            setCategoryNameError('Category name cannot be empty.');
            hasError = true;
        }

        const numBudget = Number(categoryBudget);
        if (!categoryBudget || !Number.isFinite(numBudget) || numBudget <= 0) {
            setCategoryBudgetError('Enter a category budget greater than ₱0.00.');
            hasError = true;
        }

        if (hasError) return;

        setCategories((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                name: categoryName.trim(),
                budget: numBudget,
                color: categoryColor,
            },
        ]);

        // Reset category form fields
        setCategoryName('');
        setCategoryNameError('');
        setCategoryBudget('');
        setCategoryBudgetError('');
        setCategoryColor('#176b5b');
    };

    const handleRemoveCategory = (id) => {
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
    };

    const handleCreatePool = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const newPool = await apiRequest('/pools', {
                token,
                method: 'POST',
                body: {
                    name: newPoolName,
                    description: newPoolDescription,
                    totalBudget: parseFloat(newPoolBudget),
                    categories: categories.map(({ name, budget, color }) => ({
                        name,
                        budget,
                        color,
                    })),
                },
            });

            // Reset modal state
            setNewPoolName('');
            setNewPoolDescription('');
            setNewPoolBudget('');
            setCategories([]);

            if (onPoolCreated) {
                onPoolCreated(newPool);
            } else {
                onClose();
            }
        } catch (err) {
            setError(err.message || 'Failed to create budget pool.');
        } finally {
            setIsSaving(false);
        }
    };

    const totalAllocated = categories.reduce((sum, cat) => sum + cat.budget, 0);

    return (
        <div className="create-pool-overlay" onClick={onClose}>
            <div className="create-pool-modal" onClick={(e) => e.stopPropagation()}>
                <div className="create-pool-header">
                    <div>
                        <h2>Create New Budget Pool</h2>
                        <p>Set allocations and initialize budget categories</p>
                    </div>
                    <button className="create-pool-close-btn" onClick={onClose} type="button" aria-label="Close modal">
                        &times;
                    </button>
                </div>

                <div className="create-pool-body">
                    {error && <div className="create-pool-error" role="alert">{error}</div>}

                    {/* Main Pool Information */}
                    <div className="create-pool-section">
                        <div className="create-pool-field">
                            <label htmlFor="pool-name">Pool name *</label>
                            <input
                                id="pool-name"
                                value={newPoolName}
                                onChange={(event) => setNewPoolName(event.target.value)}
                                placeholder="e.g. Q3 Marketing Operations"
                                required
                            />
                        </div>

                        <div className="create-pool-field">
                            <label htmlFor="pool-description">Description</label>
                            <textarea
                                id="pool-description"
                                value={newPoolDescription}
                                onChange={(event) => setNewPoolDescription(event.target.value)}
                                placeholder="Purpose or notes for this pool"
                                rows={2}
                            />
                        </div>

                        <div className="create-pool-field">
                            <label htmlFor="pool-budget">Total budget (PHP) *</label>
                            <input
                                id="pool-budget"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={newPoolBudget}
                                onChange={(event) => setNewPoolBudget(event.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Add Category Section */}
                    <form className="create-pool-section category-form" onSubmit={handleAddCategory}>
                        <h3>Add Category</h3>
                        <div className="create-pool-field">
                            <label htmlFor="category-name">Category name</label>
                            <input
                                id="category-name"
                                value={categoryName}
                                onChange={(event) => {
                                    setCategoryName(event.target.value);
                                    setCategoryNameError(event.target.value.trim() ? '' : 'Category name cannot be empty.');
                                }}
                                aria-invalid={Boolean(categoryNameError)}
                                aria-describedby={categoryNameError ? 'category-name-error' : undefined}
                                placeholder="e.g. Software Subscriptions"
                            />
                            {categoryNameError && (
                                <span id="category-name-error" className="create-pool-field-error" role="alert">
                                    {categoryNameError}
                                </span>
                            )}
                        </div>

                        <div className="create-pool-inline-fields">
                            <div className="create-pool-field flex-grow">
                                <label htmlFor="category-budget">Category budget (PHP)</label>
                                <input
                                    id="category-budget"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={categoryBudget}
                                    onChange={(event) => {
                                        setCategoryBudget(event.target.value);
                                        const value = Number(event.target.value);
                                        setCategoryBudgetError(
                                            event.target.value && Number.isFinite(value) && value > 0
                                                ? ''
                                                : 'Enter a category budget greater than ₱0.00.'
                                        );
                                    }}
                                    aria-invalid={Boolean(categoryBudgetError)}
                                    aria-describedby={categoryBudgetError ? 'category-budget-error' : undefined}
                                    placeholder="0.00"
                                />
                                {categoryBudgetError && (
                                    <span id="category-budget-error" className="create-pool-field-error" role="alert">
                                        {categoryBudgetError}
                                    </span>
                                )}
                            </div>

                            <div className="create-pool-field color-field">
                                <label htmlFor="category-color">Color</label>
                                <input
                                    id="category-color"
                                    className="create-pool-color-input"
                                    type="color"
                                    value={categoryColor}
                                    onChange={(event) => setCategoryColor(event.target.value)}
                                />
                            </div>
                        </div>

                        <button className="create-pool-add-cat-btn" type="submit">
                            + Add category
                        </button>
                    </form>

                    {/* Category List */}
                    {categories.length > 0 && (
                        <div className="create-pool-section categories-preview">
                            <div className="categories-header">
                                <h3>Defined Categories ({categories.length})</h3>
                                <span className="allocated-badge">
                                    Allocated: ₱{totalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="categories-chip-list">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="category-chip">
                                        <span className="color-dot" style={{ backgroundColor: cat.color }} />
                                        <span className="cat-name">{cat.name}</span>
                                        <span className="cat-amount">₱{cat.budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                        <button
                                            type="button"
                                            className="cat-remove-btn"
                                            onClick={() => handleRemoveCategory(cat.id)}
                                            title="Remove category"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="create-pool-footer">
                    <button className="create-pool-cancel-btn" type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="create-pool-submit-btn"
                        type="button"
                        onClick={handleCreatePool}
                        disabled={isSaving || !newPoolName.trim() || !newPoolBudget}
                    >
                        {isSaving ? 'Creating...' : 'Create pool'}
                    </button>
                </div>
            </div>
        </div>
    );
}