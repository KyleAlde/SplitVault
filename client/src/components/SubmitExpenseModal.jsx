import { useRef, useState } from 'react';
import { getApiErrorMessage } from '../api.js';
import './SubmitExpenseModal.css';

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);

function today() {
    const date = new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

export default function SubmitExpenseModal({ isOpen, onClose, poolId, categories, remainingBalance, onSubmit }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [incurredAt, setIncurredAt] = useState(today);
    const [receipt, setReceipt] = useState(null);
    const receiptInput = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [receiptError, setReceiptError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!poolId) {
            setError('Please select a valid budget pool from the header');
            return;
        }

        const parsedAmount = Number(amount);
        if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError('Enter an amount greater than ₱0.00.');
            return;
        }
        if (!title.trim()) {
            setError('Expense title is required.');
            return;
        }
        if (receiptError) return;
        if (!categoryId || !categories.some((category) => category.id === categoryId)) {
            setError('Please select a category');
            return;
        }
        if (exceedsCategoryRemaining) {
            setError('Amount exceeds remaining category budget');
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
            setReceiptError('');
            if (receiptInput.current) receiptInput.current.value = '';
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        } finally {
            setIsSubmitting(false);
        }
    };

    const parsedAmount = Number(amount);
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const categoryTotalSpent = Number(selectedCategory?.totalSpent ?? selectedCategory?.spent ?? 0);
    const categoryRemainingCents = Math.round(Number(selectedCategory?.budget || 0) * 100)
        - Math.round(categoryTotalSpent * 100);
    const categoryRemaining = categoryRemainingCents / 100;
    const exceedsCategoryRemaining = Boolean(selectedCategory)
        && Number.isFinite(parsedAmount)
        && parsedAmount > 0
        && Math.round(parsedAmount * 100) > categoryRemainingCents;
    const invalidAmount = !amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0;
    const exceedsRemainingBalance = Number.isFinite(remainingBalance)
        && Number.isFinite(parsedAmount)
        && parsedAmount > 0
        && parsedAmount > remainingBalance;
    const formatCurrency = (value) => new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(value || 0);
    const formattedRemainingBalance = formatCurrency(remainingBalance);

    const handleReceiptChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setReceiptError('');
        setReceipt(null);
        if (!selectedFile) return;

        if (!ALLOWED_RECEIPT_TYPES.has(selectedFile.type)) {
            setReceiptError('Choose a PNG, JPEG, WebP, or PDF receipt.');
            event.target.value = '';
            return;
        }
        if (selectedFile.size > MAX_RECEIPT_SIZE) {
            setReceiptError('Receipt file must be 5 MB or smaller.');
            event.target.value = '';
            return;
        }
        setReceipt(selectedFile);
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
                    <select value={categoryId} onChange={(event) => {
                        setCategoryId(event.target.value);
                        setError('');
                    }} required>
                        <option value="">Select a category</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    {selectedCategory && (
                        <span className="claim-form-hint">
                            Category Remaining Balance: {formatCurrency(categoryRemaining)}
                        </span>
                    )}
                </label>
                <div className="claim-form-row">
                    <label>
                        Amount (PHP)
                        <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} required aria-invalid={invalidAmount || exceedsCategoryRemaining} />
                        <span className="claim-form-hint">Enter an amount greater than ₱0.00.</span>
                        {amount && invalidAmount && (
                            <span className="claim-form-error" role="alert">
                                Enter an amount greater than ₱0.00.
                            </span>
                        )}
                        {exceedsCategoryRemaining && (
                            <span className="claim-form-error" role="alert">
                                Amount exceeds remaining category budget
                            </span>
                        )}
                        {exceedsRemainingBalance && (
                            <span className="claim-budget-warning" role="status">
                                ⚠️ Warning: This amount exceeds the remaining pool balance of {formattedRemainingBalance}. Admin approval will be blocked.
                            </span>
                        )}
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
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleReceiptChange}
                    />
                    <span className="claim-form-hint">
                        {receipt ? receipt.name : 'Attach a PNG, JPEG, WebP, or PDF receipt (maximum 5 MB).'}
                    </span>
                    {receiptError && <span className="claim-form-error" role="alert">{receiptError}</span>}
                </label>
                {error && <p className="claim-form-error" role="alert">{error}</p>}
                <div className="claim-modal-actions">
                    <button type="button" className="claim-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" className="claim-submit" disabled={isSubmitting || categories.length === 0 || invalidAmount || exceedsCategoryRemaining}>
                        {isSubmitting ? 'Submitting...' : 'Submit for review'}
                    </button>
                </div>
            </form>
        </div>
    );
}