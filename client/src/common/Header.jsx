import notifButton from '../assets/notif_button.svg';
import './Header.css';

export default function Header({ selectedPoolId, pools, onPoolChange, onNewClaim }) {
    const selectedPool = pools.find((pool) => pool.id === selectedPoolId);

    return (
        <header className="floating-header">
            <div className="header-left">
                <div className="breadcrumb" aria-label="Breadcrumb">
                    <span>SplitVault</span>
                    <span className="breadcrumb-separator">/</span>
                    <strong>Dashboard</strong>
                    {selectedPool?.name && (
                        <>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-current">{selectedPool.name}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="header-right">
                <div className="pool-selector-wrapper">
                    <select className="pool-selector" value={selectedPoolId} onChange={(e) => onPoolChange(e.target.value)}>
                        {pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
                    </select>
                </div>
                <button className="icon-btn" aria-label="Notifications" title="Notifications">
                    <img src={notifButton} alt="" className="nav-icon-img" />
                </button>
                <button className="header-new-claim-button" type="button" onClick={onNewClaim}>
                    <span aria-hidden="true">+</span> New Claim
                </button>
            </div>
        </header>
    );
}
