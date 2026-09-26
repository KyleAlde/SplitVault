import { useState } from 'react';
import './SubmitExpenseModal.css';

function today() {
    const date = new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

export default function SubmitExpenseModal({ isOpen, onClose, categories, onSubmit }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [incurredAt, setIncurredAt] = useState(today);
    const [filePath, setFilePath] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await onSubmit({
                title,
                description,
                amount: Number(amount),
                categoryId,
                incurredAt: new Date(`${incurredAt}T12:00:00`).toISOString(),
                receipt: { filePath },
            });
            setTitle('');
            setDescription('');
            setAmount('');
            setCategoryId('');
            setIncurredAt(today());
            setFilePath('');
        } catch (requestError) {
            setError(requestError.message || 'Unable to submit this claim.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="claim-modal-overlay" onClick={onClose}>
            <form className="claim-modal" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
                <div className="claim-modal-header">
                    <div>
                        <h2>Submit Expense</h2>
                        <p>Enter the expense details for review.</p>
                    </div>
                    <button type="button" className="claim-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <label>
                    Expense title
                    <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
                </label>
                <label>
                    Category
                    <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                        <option value="">Select a category</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                </label>
                <div className="claim-form-row">
                    <label>
                        Amount (PHP)
                        <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
                    </label>
                    <label>
                        Expense date
                        <input type="date" value={incurredAt} onChange={(event) => setIncurredAt(event.target.value)} required />
                    </label>
                </div>
                <label>
                    Description
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
                </label>
                <label>
                    Receipt file path
                    <input value={filePath} onChange={(event) => setFilePath(event.target.value)} required placeholder="e.g. receipts/claim-001.pdf" />
                    <span className="claim-form-hint">The server stores this path as metadata; it does not upload receipt files.</span>
                </label>
                {error && <p className="claim-form-error" role="alert">{error}</p>}
                <div className="claim-modal-actions">
                    <button type="button" className="claim-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" className="claim-submit" disabled={isSubmitting || categories.length === 0}>
                        {isSubmitting ? 'Submitting...' : 'Submit for review'}
                    </button>
                </div>
            </form>
        </div>
    );
}