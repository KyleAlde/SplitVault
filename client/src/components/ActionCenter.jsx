import React from 'react';
import './ActionCenter.css';

export default function ActionCenter({ claims = [], onSubmitExpense, onReviewAll, onViewClaim }) {
	const displayClaims = claims.length > 0 ? claims.slice(0, 4) : [
		{ id: 'clm-301', title: 'Org Web Domain & Cloud Hosting', claimant: 'Dev Team Lead', amount: 4800.00, date: '2026-09-15' },
		{ id: 'clm-302', title: 'Git Workshop Biscuit Packs', claimant: 'John Tan', amount: 5000.00, date: '2026-09-19' },
		{ id: 'clm-303', title: 'Client Dinner & Alignment', claimant: 'Alex Rivera', amount: 3450.00, date: '2026-09-22' },
		{ id: 'clm-304', title: 'Grab Ride to Airport', claimant: 'Sarah Chen', amount: 850.00, date: '2026-09-24' }
	];

	return (
		<div className="action-center-card">
			<div className="submit-area">
				<button 
					type="button" 
					className="btn-submit-white"
					onClick={onSubmitExpense}
				>
					<span className="plus-icon">+</span>
					<span>Submit Expense</span>
				</button>
			</div>

			<div className="claims-list">
				<div className="claims-header">
					<span className="claims-title">Pending Approvals</span>
					<span className="claims-count">{displayClaims.length}</span>
				</div>

				<div className="claims-items-container">
					{displayClaims.map((claim) => (
						<div 
							key={claim.id} 
							className="claim-mini-card"
							onClick={() => onViewClaim && onViewClaim(claim.id)}
						>
							<div className="claim-info">
								<span className="claim-name">{claim.title || claim.claimant}</span>
								<span className="claim-date">{claim.date}</span>
							</div>
							<span className="claim-amount">
								₱{Number(claim.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
							</span>
						</div>
					))}
				</div>

				<button 
					type="button" 
					className="btn-view-all"
					onClick={onReviewAll}
				>
					View All Claims →
				</button>
			</div>
		</div>
	);
}