import { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import './SettingsModal.css';

export default function SettingsModal({ token, selectedPool, onClose, onPoolCreated, onPoolUpdated }) {
    const [poolName, setPoolName] = useState(selectedPool?.name || '');
    const [description, setDescription] = useState(selectedPool?.description || '');
    const [newPoolName, setNewPoolName] = useState('');
    const [newPoolDescription, setNewPoolDescription] = useState('');
    const [newPoolBudget, setNewPoolBudget] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [categoryBudget, setCategoryBudget] = useState('');
    const [categoryColor, setCategoryColor] = useState('#425b9a');
    const [categoryNameError, setCategoryNameError] = useState('');
    const [categoryBudgetError, setCategoryBudgetError] = useState('');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [poolMembers, setPoolMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedPool || !token) {
            setPendingRequests([]);
            setPoolMembers([]);
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

        loadPendingRequests();
        loadPoolMembers();
        return () => {
            isMounted = false;
        };
    }, [selectedPool, token]);

    const savePool = async (event) => {
        event.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const response = await apiRequest(`/pools/${selectedPool.id}`, {
                token,
                method: 'PATCH',
                body: { name: poolName, description },
            });
            setPoolName(response.pool.name);
            setDescription(response.pool.description || '');
            onPoolUpdated(response.pool);
        } catch (requestError) {
            setError(requestError.message || 'Unable to update this pool.');
        } finally {
            setIsSaving(false);
        }
    };

    const createPool = async (event) => {
        event.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const response = await apiRequest('/pools', {
                token,
                method: 'POST',
                body: { name: newPoolName, description: newPoolDescription, totalBudget: Number(newPoolBudget) },
            });
            onPoolCreated(response.pool);
        } catch (requestError) {
            setError(requestError.message || 'Unable to create this pool.');
        } finally {
            setIsSaving(false);
        }
    };

    const createCategory = async (event) => {
        event.preventDefault();
        setError('');
        const trimmedCategoryName = categoryName.trim();
        const parsedCategoryBudget = Number(categoryBudget);
        const nameError = trimmedCategoryName ? '' : 'Category name cannot be empty.';
        const budgetError = Number.isFinite(parsedCategoryBudget) && parsedCategoryBudget > 0
            ? ''
            : 'Enter a category budget greater than ₱0.00.';
        setCategoryNameError(nameError);
        setCategoryBudgetError(budgetError);
        if (nameError || budgetError) return;

        setIsSaving(true);
        try {
            await apiRequest(`/pools/${selectedPool.id}/categories`, {
                token,
                method: 'POST',
                body: { name: trimmedCategoryName, budget: parsedCategoryBudget, color: categoryColor },
            });
            setCategoryName('');
            setCategoryBudget('');
            setCategoryNameError('');
            setCategoryBudgetError('');
            onPoolUpdated(selectedPool);
        } catch (requestError) {
            setError(requestError.message || 'Unable to create this category.');
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
            setError(requestError.message || `Unable to ${action} this request.`);
        }
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
                            <h3>Edit Active Pool</h3>
                            <label className="settings-field">
                                Pool name
                                <input value={poolName} onChange={(event) => setPoolName(event.target.value)} required />
                            </label>
                            <label className="settings-field">
                                Description
                                <textarea value={description || ''} onChange={(event) => setDescription(event.target.value)} rows={2} />
                            </label>
                            <button className="settings-save-btn" type="submit" disabled={isSaving}>Save pool</button>
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
                                </label>
                                <label className="settings-field">
                                    Color
                                    <input className="settings-color-input" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} />
                                </label>
                            </div>
                            <button className="settings-save-btn" type="submit" disabled={isSaving}>Add category</button>
                        </form>
                    </>}
                    {error && <p className="settings-error" role="alert">{error}</p>}
                </div>
            </div>
        </div>
    );
}