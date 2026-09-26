import React, { useState } from 'react';
import './Ledger.css';

export default function Ledger({ claims = [], categories = [] }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [visibleCount, setVisibleCount] = useState(5);

	const getCategoryColor = (categoryName) => {
		const category = categories.find((cat) => cat.name === categoryName);
		return category ? category.color : 'var(--text)';
	};

	const filteredClaims = claims.filter((claim) => {
		const isApproved = claim.status === 'Approved';
		const matchesSearch = 
			claim.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
			claim.claimant.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'All' || claim.category === selectedCategory;
		
		return isApproved && matchesSearch && matchesCategory;
	});

	const displayedClaims = filteredClaims.slice(0, visibleCount);

	const handleLoadMore = () => {
		setVisibleCount((prev) => prev + 5);
	};

	return (
		<div className="ledger-card">
			<div className="ledger-header">
				<div className="header-titles">
					<h3>Transaction Ledger</h3>
					<span className="sub-text">Approved and settled disbursements</span>
				</div>
				
				<div className="ledger-controls">
					<input 
						type="text" 
						className="ledger-search" 
						placeholder="Search claims or people..." 
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<select 
						className="ledger-select"
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
					>
						<option value="All">All Categories</option>
						{categories.map((cat, idx) => (
							<option key={idx} value={cat.name}>{cat.name}</option>
						))}
					</select>
				</div>
			</div>

			<div className="table-container">
				{displayedClaims.length === 0 ? (
					<div className="empty-state">
						<p>No settled transactions match your criteria.</p>
					</div>
				) : (
					<table className="ledger-table">
						<thead>
							<tr>
								<th>Description</th>
								<th>Claimant</th>
								<th>Category</th>
								<th className="text-right">Amount</th>
								<th className="text-right">Date</th>
							</tr>
						</thead>
						<tbody>
							{displayedClaims.map((claim) => (
								<tr key={claim.id}>
									<td className="col-title">{claim.title}</td>
									<td className="col-claimant">{claim.claimant}</td>
									<td>
										<span className="category-pill">
											<span 
												className="cat-dot" 
												style={{ backgroundColor: getCategoryColor(claim.category) }}
											></span>
											{claim.category}
										</span>
									</td>
									<td className="text-right col-amount">
										₱{Number(claim.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
									</td>
									<td className="text-right col-date">{claim.date}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{filteredClaims.length > visibleCount && (
				<div className="card-footer-centered">
					<button 
						type="button" 
						className="btn-load-more"
						onClick={handleLoadMore}
					>
						Load More ↓
					</button>
				</div>
			)}
		</div>
	);
}