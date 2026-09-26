import { useState } from 'react';
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
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
        setIsSaving(true);
        try {
            await apiRequest(`/pools/${selectedPool.id}/categories`, {
                token,
                method: 'POST',
                body: { name: categoryName, budget: Number(categoryBudget), color: categoryColor },
            });
            setCategoryName('');
            setCategoryBudget('');
            onPoolUpdated(selectedPool);
        } catch (requestError) {
            setError(requestError.message || 'Unable to create this category.');
        } finally {
            setIsSaving(false);
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
                            <h3>Active Pool</h3>
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

                        <form className="settings-section" onSubmit={createCategory}>
                            <h3>Add Category</h3>
                            <label className="settings-field">
                                Category name
                                <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
                            </label>
                            <div className="settings-inline-fields">
                                <label className="settings-field">
                                    Category budget (PHP)
                                    <input type="number" min="0" step="0.01" value={categoryBudget} onChange={(event) => setCategoryBudget(event.target.value)} required />
                                </label>
                                <label className="settings-field">
                                    Color
                                    <input className="settings-color-input" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} />
                                </label>
                            </div>
                            <button className="settings-save-btn" type="submit" disabled={isSaving}>Add category</button>
                        </form>
                    </>}

                    <form className="settings-section" onSubmit={createPool}>
                        <h3>Create Budget Pool</h3>
                        <label className="settings-field">
                            Pool name
                            <input value={newPoolName} onChange={(event) => setNewPoolName(event.target.value)} required />
                        </label>
                        <label className="settings-field">
                            Description
                            <textarea value={newPoolDescription} onChange={(event) => setNewPoolDescription(event.target.value)} rows={2} />
                        </label>
                        <label className="settings-field">
                            Total budget (PHP)
                            <input type="number" min="0.01" step="0.01" value={newPoolBudget} onChange={(event) => setNewPoolBudget(event.target.value)} required />
                        </label>
                        <button className="settings-save-btn" type="submit" disabled={isSaving}>Create pool</button>
                    </form>

                    {error && <p className="settings-error" role="alert">{error}</p>}
                </div>

            </div>
        </div>
    );
}