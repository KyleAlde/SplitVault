import { useRef, useState } from 'react';
import './SubmitExpenseModal.css';

function today() {
    const date = new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

export default function SubmitExpenseModal({ isOpen, onClose, poolId, categories, onSubmit }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [incurredAt, setIncurredAt] = useState(today);
    const [receipt, setReceipt] = useState(null);
    const receiptInput = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!poolId) {
            setError('Please select a valid budget pool from the header');
            return;
        }

        const parsedAmount = Number.parseFloat(amount);
        if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError('Title and a positive amount are required');
            return;
        }
        if (!categoryId || !categories.some((category) => category.id === categoryId)) {
            setError('Please select a category');
            return;
        }
        const incurredAtDate = new Date(incurredAt);
        if (!incurredAt || Number.isNaN(incurredAtDate.getTime())) {
            setError('Please provide a valid expense date');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('amount', parsedAmount.toString());
            formData.append('categoryId', categoryId);
            formData.append('incurredAt', incurredAt);
            formData.append('description', description);
            if (receipt) formData.append('receipt', receipt);
            await onSubmit(formData);
            setTitle('');
            setDescription('');
            setAmount('');
            setCategoryId('');
            setIncurredAt(today());
            setReceipt(null);
            if (receiptInput.current) receiptInput.current.value = '';
        } catch (requestError) {
            setError(requestError.message);
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
                    Receipt attachment (optional)
                    <input
                        ref={receiptInput}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => setReceipt(event.target.files?.[0] || null)}
                    />
                    <span className="claim-form-hint">
                        {receipt ? receipt.name : 'Attach an image or PDF receipt (maximum 10 MB).'}
                    </span>
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