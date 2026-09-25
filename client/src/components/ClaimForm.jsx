import { useEffect, useState } from 'react';
import { createClaim, getCategories } from '../api';
import './ClaimForm.css';

const initialForm = {
    title: '',
    description: '',
    amount: '',
    categoryId: '',
    incurredAt: '',
    receiptPath: '',
    receiptFileName: '',
    receiptMimeType: '',
};

function validate(form, categories) {
    const errors = {};
    const amount = Number(form.amount);
    const incurredDate = form.incurredAt ? new Date(`${form.incurredAt}T00:00:00`) : null;

    if (!form.title.trim()) errors.title = 'Expense title is required.';
    if (!form.description.trim()) errors.description = 'Description or purpose is required.';
    if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Amount must be greater than zero.';
    if (!form.categoryId) {
        errors.categoryId = 'Select a category.';
    } else if (!categories.some((category) => category.id === form.categoryId)) {
        errors.categoryId = 'Select a category from this budget pool.';
    }
    if (!form.incurredAt || !incurredDate || Number.isNaN(incurredDate.getTime())) {
        errors.incurredAt = 'Enter a valid date incurred.';
    }
    if (!form.receiptPath.trim()) errors.receiptPath = 'Receipt reference or path is required.';

    return errors;
}

export default function ClaimForm({ poolId, onSubmitted, onCancel }) {
    const [form, setForm] = useState(initialForm);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState('');
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        if (!poolId) return () => { active = false; };

        getCategories(poolId)
            .then(({ categories: nextCategories }) => {
                if (active) setCategories(nextCategories);
            })
            .catch((error) => {
                if (active) setCategoriesError(error.message);
            })
            .finally(() => {
                if (active) setCategoriesLoading(false);
            });

        return () => {
            active = false;
        };
    }, [poolId]);

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: '' }));
        setSubmitError('');
    }

    async function submit(event) {
        event.preventDefault();
        if (submitting) return;

        const nextErrors = validate(form, categories);
        setErrors(nextErrors);
        setSubmitError('');
        setSuccessMessage('');
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        try {
            await createClaim(poolId, {
                title: form.title.trim(),
                description: form.description.trim(),
                amount: Number(form.amount),
                categoryId: form.categoryId,
                incurredAt: form.incurredAt,
                receipt: {
                    filePath: form.receiptPath.trim(),
                    ...(form.receiptFileName.trim() ? { fileName: form.receiptFileName.trim() } : {}),
                    ...(form.receiptMimeType.trim() ? { mimeType: form.receiptMimeType.trim() } : {}),
                },
            });
            setForm(initialForm);
            setErrors({});
            setSuccessMessage('Expense claim submitted successfully.');
            onSubmitted();
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="claim-form-card" aria-labelledby="claim-form-heading">
            <div className="claim-form-header">
                <div>
                    <h2 id="claim-form-heading">New Expense Claim</h2>
                    <p>Submit an expense for the selected budget pool.</p>
                </div>
                <button className="claim-form-close" type="button" onClick={onCancel} disabled={submitting}>
                    Cancel
                </button>
            </div>

            <div className="receipt-notice">
                <strong>Receipt metadata only</strong>
                <span>There is no file-upload service yet. Enter the receipt&apos;s existing path or URL; no local file is uploaded.</span>
            </div>

            {categoriesError && <p className="claim-form-error" role="alert">{categoriesError}</p>}
            {submitError && <p className="claim-form-error" role="alert">{submitError}</p>}
            {successMessage && <p className="claim-form-success" role="status">{successMessage}</p>}

            <form className="claim-form" onSubmit={submit} noValidate>
                <label>
                    Expense title
                    <input name="title" value={form.title} onChange={updateField} aria-invalid={Boolean(errors.title)} />
                    {errors.title && <span className="field-error">{errors.title}</span>}
                </label>
                <label>
                    Description / purpose
                    <textarea name="description" value={form.description} onChange={updateField} rows="3" aria-invalid={Boolean(errors.description)} />
                    {errors.description && <span className="field-error">{errors.description}</span>}
                </label>
                <div className="claim-form-grid">
                    <label>
                        Amount (PHP)
                        <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} aria-invalid={Boolean(errors.amount)} />
                        {errors.amount && <span className="field-error">{errors.amount}</span>}
                    </label>
                    <label>
                        Date incurred
                        <input name="incurredAt" type="date" value={form.incurredAt} onChange={updateField} aria-invalid={Boolean(errors.incurredAt)} />
                        {errors.incurredAt && <span className="field-error">{errors.incurredAt}</span>}
                    </label>
                </div>
                <label>
                    Category
                    <select name="categoryId" value={form.categoryId} onChange={updateField} disabled={categoriesLoading || categories.length === 0} aria-invalid={Boolean(errors.categoryId)}>
                        <option value="">{categoriesLoading ? 'Loading categories...' : 'Select a category'}</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
                </label>
                <label>
                    Receipt reference / path
                    <input name="receiptPath" value={form.receiptPath} onChange={updateField} placeholder="e.g. receipts/meal-2026-09-25.pdf" aria-invalid={Boolean(errors.receiptPath)} />
                    {errors.receiptPath && <span className="field-error">{errors.receiptPath}</span>}
                </label>
                <div className="claim-form-grid">
                    <label>
                        Receipt file name <span className="optional-label">(optional)</span>
                        <input name="receiptFileName" value={form.receiptFileName} onChange={updateField} placeholder="meal-2026-09-25.pdf" />
                    </label>
                    <label>
                        MIME type <span className="optional-label">(optional)</span>
                        <input name="receiptMimeType" value={form.receiptMimeType} onChange={updateField} placeholder="application/pdf" />
                    </label>
                </div>
                <div className="claim-form-actions">
                    <button className="claim-submit-button" type="submit" disabled={submitting || categoriesLoading || categories.length === 0}>
                        {submitting ? 'Submitting...' : 'Submit Expense'}
                    </button>
                </div>
            </form>
        </section>
    );
}
