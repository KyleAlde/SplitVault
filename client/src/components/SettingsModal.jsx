import { useEffect, useState } from 'react';
import { apiRequest, getApiErrorMessage } from '../api.js';
import EditCategoryModal from './EditCategoryModal.jsx';
import './SettingsModal.css';

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

export default function SettingsModal({ token, selectedPool, onClose, onPoolUpdated }) {
    const [poolName, setPoolName] = useState(selectedPool?.name || '');
    const [description, setDescription] = useState(selectedPool?.description || '');
    const [organizationName, setOrganizationName] = useState(selectedPool?.organizationName || '');
    const [totalBudget, setTotalBudget] = useState(
        selectedPool?.totalBudget === undefined ? '' : String(selectedPool.totalBudget),
    );
    const [categoryName, setCategoryName] = useState('');
    const [categoryBudget, setCategoryBudget] = useState('');
    const [categoryColor, setCategoryColor] = useState('#425b9a');
    const [categoryNameError, setCategoryNameError] = useState('');
    const [categoryBudgetError, setCategoryBudgetError] = useState('');
    const [poolDetails, setPoolDetails] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [poolMembers, setPoolMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedPool?.id || !token) {
            return undefined;
        }

        let isMounted = true;

        async function loadPendingRequests() {
            setIsLoadingRequests(true);
            try {
                const response = await apiRequest(`/pools/${selectedPool.id}/access-requests`, { token });
                if (isMounted) {
                    setPendingRequests(response.requests || []);
                }
            } catch (requestError) {
                if (isMounted) {
                    setPendingRequests([]);
                    setError(requestError.message || 'Unable to load access requests.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingRequests(false);
                }
            }
        }

        async function loadPoolMembers() {
            setIsLoadingMembers(true);
            try {
                const response = await apiRequest(`/pools/${selectedPool.id}/members`, { token });
                if (isMounted) {
                    setPoolMembers(response.members || []);
                }
            } catch (requestError) {
                if (isMounted) {
                    setPoolMembers([]);
                    setError(requestError.message || 'Unable to load pool members.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingMembers(false);
                }
            }
        }

        async function loadPoolDetails() {
            try {
                const response = await apiRequest(`/pools/${selectedPool.id}`, { token });
                if (isMounted) {
                    setPoolDetails(response.pool);
                    setTotalBudget(String(response.pool.totalBudget));
                    setOrganizationName(response.pool.organizationName || '');
                }
            } catch (requestError) {
                if (isMounted) {
                    setPoolDetails(null);
                    setError(getApiErrorMessage(requestError, 'Unable to load pool budget and categories.'));
                }
            }
        }

        loadPendingRequests();
        loadPoolMembers();
        loadPoolDetails();
        return () => {
            isMounted = false;
        };
    }, [selectedPool?.id, token]);

    const savePool = async (event) => {
        event.preventDefault();
        setError('');
        if (poolBudgetValidationError) return;
        setIsSaving(true);
        try {
            const response = await apiRequest(`/pools/${selectedPool.id}`, {
                token,
                method: 'PATCH',
                body: {
                    name: poolName,
                    description,
                    organizationName: organizationName.trim() || null,
                    totalBudget: Number(totalBudget),
                },
            });
            setPoolName(response.pool.name);
            setDescription(response.pool.description || '');
            setOrganizationName(response.pool.organizationName || '');
            setTotalBudget(String(response.pool.totalBudget));
            setPoolDetails((current) => current && ({ ...current, ...response.pool }));
            onPoolUpdated(response.pool);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Unable to update this pool.'));
        } finally {
            setIsSaving(false);
        }
    };

    const createCategory = async (event) => {
        event.preventDefault();
        setError('');
        const trimmedCategoryName = categoryName.trim();
        const parsedCategoryBudget = Number(categoryBudget);
        const availableReserveCents = poolDetails
            ? toCents(poolDetails.totalBudget) - (poolDetails.categories || []).reduce(
                (sum, category) => sum + toCents(category.budget),
                0,
            )
            : 0;
        const nameError = trimmedCategoryName ? '' : 'Category name cannot be empty.';
        const budgetError = Number.isFinite(parsedCategoryBudget) && parsedCategoryBudget > 0
            ? ''
            : 'Enter a category budget greater than ₱0.00.';
        setCategoryNameError(nameError);
        setCategoryBudgetError(budgetError);
        if (nameError || budgetError || toCents(parsedCategoryBudget) > availableReserveCents || !poolDetails) return;

        setIsSaving(true);
        try {
            await apiRequest(`/pools/${selectedPool.id}/categories`, {
                token,
                method: 'POST',
                body: { name: trimmedCategoryName, budget: parsedCategoryBudget, color: categoryColor },
            });
            const poolResponse = await apiRequest(`/pools/${selectedPool.id}`, { token });
            setPoolDetails(poolResponse.pool);
            setCategoryName('');
            setCategoryBudget('');
            setCategoryNameError('');
            setCategoryBudgetError('');
            onPoolUpdated(selectedPool);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, 'Unable to create this category.'));
        } finally {
            setIsSaving(false);
        }
    };

    const resolvePendingRequest = async (requestId, action) => {
        setError('');
        try {
            await apiRequest(`/pools/${selectedPool.id}/access-requests/${requestId}/${action}`, {
                token,
                method: 'POST',
            });
            setPendingRequests((currentRequests) => currentRequests.filter((request) => request.id !== requestId));
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, `Unable to ${action} this request.`));
        }
    };

    const poolCategories = poolDetails?.categories || [];
    const availableReserveCents = poolDetails
        ? toCents(poolDetails.totalBudget) - poolCategories.reduce((sum, category) => sum + toCents(category.budget), 0)
        : 0;
    const availableReserve = availableReserveCents / 100;
    const currentCategoryAllocationCents = poolCategories.reduce(
        (sum, category) => sum + toCents(category.budget),
        0,
    );
    const poolSpentCents = toCents(poolDetails?.totalSpent || 0);
    const minimumPoolBudgetCents = Math.max(currentCategoryAllocationCents, poolSpentCents);
    const parsedPoolBudget = Number(totalBudget);
    const poolBudgetValid = totalBudget !== '' && Number.isFinite(parsedPoolBudget) && parsedPoolBudget > 0;
    const poolBudgetValidationError = !poolBudgetValid
        ? 'Enter a total budget greater than ₱0.00.'
        : toCents(parsedPoolBudget) < currentCategoryAllocationCents
            ? `Total budget cannot be lower than allocated category budgets (${formatPHP(currentCategoryAllocationCents / 100)}).`
            : toCents(parsedPoolBudget) < poolSpentCents
                ? `Total budget cannot be lower than approved pool spending (${formatPHP(poolSpentCents / 100)}).`
                : '';
    const parsedCategoryBudget = Number(categoryBudget);
    const invalidCategoryBudget = !categoryBudget || !Number.isFinite(parsedCategoryBudget) || parsedCategoryBudget <= 0;
    const exceedsCategoryReserve = !invalidCategoryBudget
        && toCents(parsedCategoryBudget) > availableReserveCents;

    const updateCategory = (updatedCategory) => {
        setPoolDetails((current) => current && ({
            ...current,
            categories: current.categories.map((category) => (
                category.id === updatedCategory.id ? updatedCategory : category
            )),
        }));
        setEditingCategory(null);
        onPoolUpdated(selectedPool);
    };

    return (
        <div className="settings-modal-overlay">
            <div className="settings-modal">
                <div className="settings-modal-header">
                    <div>
                        <h2>Pool Management</h2>
                        <p>Create budget pools, update the active pool, and add categories.</p>
                    </div>

                    <button
                        className="settings-close-btn"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="settings-modal-body">
                    {selectedPool && <>
                        <form className="settings-section" onSubmit={savePool}>
                            <p className="settings-pool-id">Pool ID: <span>{selectedPool.id}</span></p>
                            <h3>Edit Active Pool</h3>
                            <label className="settings-field">
                                Total budget (PHP)
                                <input
                                    type="number"
                                    min={minimumPoolBudgetCents / 100 || 0.01}
                                    step="0.01"
                                    value={totalBudget}
                                    onChange={(event) => {
                                        setTotalBudget(event.target.value);
                                        setError('');
                                    }}
                                    aria-invalid={Boolean(totalBudget && poolBudgetValidationError)}
                                    aria-describedby={poolBudgetValidationError ? 'pool-budget-error' : undefined}
                                    required
                                />
                                {poolDetails && (
                                    <span className="settings-field-hint">
                                        Minimum allowed: {formatPHP(minimumPoolBudgetCents / 100)}
                                    </span>
                                )}
                                {poolBudgetValidationError && (
                                    <span id="pool-budget-error" className="settings-field-error" role="alert">
                                        {poolBudgetValidationError}
                                    </span>
                                )}
                            </label>
                            <label className="settings-field">
                                Pool name
                                <input value={poolName} onChange={(event) => setPoolName(event.target.value)} required />
                            </label>
                            <label className="settings-field">
                                Description
                                <textarea value={description || ''} onChange={(event) => setDescription(event.target.value)} rows={2} />
                            </label>
                            <label className="settings-field">
                                Organization
                                <input
                                    type="text"
                                    value={organizationName}
                                    onChange={(event) => setOrganizationName(event.target.value)}
                                    placeholder="e.g., Computer Science Society"
                                />
                            </label>
                            <button className="settings-save-btn" type="submit" disabled={isSaving || !poolDetails || Boolean(poolBudgetValidationError)}>Save</button>
                        </form>

                        <section className="settings-section settings-members-panel">
                            <h3>Pool Members</h3>
                            {isLoadingMembers ? (
                                <p className="settings-empty-state">Loading members...</p>
                            ) : poolMembers.length === 0 ? (
                                <p className="settings-empty-state">No members found for this pool.</p>
                            ) : (
                                <div className="settings-member-list">
                                    {poolMembers.map((member) => (
                                        <div key={member.userId} className="settings-member-item">
                                            <div className="settings-request-meta">
                                                <strong>{member.user?.name || 'Pool member'}</strong>
                                                <span>{member.user?.email || 'Unknown email'}</span>
                                            </div>
                                            <span className={`settings-member-role ${member.role === 'ADMIN' ? 'admin' : ''}`}>
                                                {member.role === 'ADMIN' ? 'Admin' : 'Contributor'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className="settings-section settings-request-panel">
                            <h3>Pending Access Requests</h3>
                            {isLoadingRequests ? (
                                <p className="settings-empty-state">Loading requests...</p>
                            ) : pendingRequests.length === 0 ? (
                                <p className="settings-empty-state">No pending requests for this pool.</p>
                            ) : (
                                <div className="settings-request-list">
                                    {pendingRequests.map((request) => (
                                        <div key={request.id} className="settings-request-item">
                                            <div className="settings-request-meta">
                                                <strong>{request.user?.name || 'Requested member'}</strong>
                                                <span>{request.user?.email || 'Unknown email'}</span>
                                            </div>
                                            {request.requestNote && (
                                                <p className="settings-request-note">“{request.requestNote}”</p>
                                            )}
                                            <div className="settings-request-actions">
                                                <button
                                                    type="button"
                                                    className="settings-request-btn reject"
                                                    onClick={() => resolvePendingRequest(request.id, 'reject')}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    type="button"
                                                    className="settings-request-btn approve"
                                                    onClick={() => resolvePendingRequest(request.id, 'approve')}
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <form className="settings-section" onSubmit={createCategory}>
                            <h3>Add Category</h3>
                            <label className="settings-field">
                                Category name
                                <input
                                    value={categoryName}
                                    onChange={(event) => {
                                        setCategoryName(event.target.value);
                                        setCategoryNameError(event.target.value.trim() ? '' : 'Category name cannot be empty.');
                                    }}
                                    aria-invalid={Boolean(categoryNameError)}
                                    aria-describedby="category-name-error"
                                    required
                                />
                                {categoryNameError && <span id="category-name-error" className="settings-field-error" role="alert">{categoryNameError}</span>}
                            </label>
                            <div className="settings-inline-fields">
                                <label className="settings-field">
                                    Category budget (PHP)
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={categoryBudget}
                                        onChange={(event) => {
                                            setCategoryBudget(event.target.value);
                                            const value = Number(event.target.value);
                                            setCategoryBudgetError(event.target.value && Number.isFinite(value) && value > 0
                                                ? ''
                                                : 'Enter a category budget greater than ₱0.00.');
                                        }}
                                        aria-invalid={Boolean(categoryBudgetError)}
                                        aria-describedby="category-budget-error"
                                        required
                                    />
                                    {categoryBudgetError && <span id="category-budget-error" className="settings-field-error" role="alert">{categoryBudgetError}</span>}
                                    {poolDetails && (
                                        <span className="settings-field-hint">
                                            Available unallocated funds: {formatPHP(availableReserve)}
                                        </span>
                                    )}
                                    {exceedsCategoryReserve && (
                                        <span className="settings-field-error" role="alert">
                                            Requested budget exceeds available unallocated reserve ({formatPHP(availableReserve)})
                                        </span>
                                    )}
                                </label>
                                <label className="settings-field">
                                    Color
                                    <input className="settings-color-input" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} />
                                </label>
                            </div>
                            <button
                                className="settings-save-btn"
                                type="submit"
                                disabled={isSaving || !poolDetails || !categoryName.trim() || invalidCategoryBudget || exceedsCategoryReserve}
                            >
                                Add category
                            </button>
                        </form>

                        <section className="settings-section">
                            <h3>Pool Categories</h3>
                            {!poolDetails ? (
                                <p className="settings-empty-state">Loading category budgets...</p>
                            ) : poolCategories.length === 0 ? (
                                <p className="settings-empty-state">No categories have been added to this pool.</p>
                            ) : (
                                <div className="settings-category-list">
                                    {poolCategories.map((category) => (
                                        <div key={category.id} className="settings-category-item">
                                            <span className="settings-category-color" style={{ backgroundColor: category.color }} />
                                            <div className="settings-category-info">
                                                <strong>{category.name}</strong>
                                                <span>
                                                    Budget {formatPHP(category.budget)} · Spent {formatPHP(category.totalSpent || 0)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="settings-category-edit"
                                                onClick={() => setEditingCategory(category)}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>}
                    {error && <p className="settings-error" role="alert">{error}</p>}
                </div>
            </div>
            {editingCategory && poolDetails && (
                <EditCategoryModal
                    key={editingCategory.id}
                    token={token}
                    poolId={selectedPool.id}
                    category={editingCategory}
                    totalSpent={editingCategory.totalSpent || 0}
                    unallocatedReserve={availableReserve}
                    onClose={() => setEditingCategory(null)}
                    onUpdated={updateCategory}
                />
            )}
        </div>
    );
}