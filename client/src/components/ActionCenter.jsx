import './ActionCenter.css';

export default function ActionCenter({ claims = [], canReview = false, onSubmitExpense, onReviewAll, onReviewClaim }) {
	const displayClaims = claims.length > 0 ? claims.slice(0, 4) : [];

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
					<span className="claims-title">{canReview ? 'Pending Approvals' : 'My Pending Claims'}</span>
					<span className="claims-count">{claims.length}</span>
				</div>

				<div className="claims-items-container">
					{displayClaims.map((claim) => (
						<div 
							key={claim.id} 
							className="claim-mini-card"
							onClick={canReview ? () => onReviewClaim(claim.id) : undefined}
							style={{ cursor: canReview ? 'pointer' : 'default' }}
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

				{canReview && claims.length > 4 && (
					<div className="action-center-footer">
						<button 
							type="button" 
							className="btn-view-all"
							onClick={onReviewAll}
						>
							View All Pending ({claims.length}) →
						</button>
					</div>
				)}
			</div>
		</div>
	);
}