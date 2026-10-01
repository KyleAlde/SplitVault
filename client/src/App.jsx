import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Header from './common/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import Login from './pages/Login.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { apiRequest } from './api.js';

const TOKEN_KEY = 'splitvault_token';

function PoolDashboardWrapper({
  currentUser,
  pools,
  token,
  poolRefreshKey,
  onLogout,
  onProfile,
  onSettings,
}) {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const selectedPool = pools.find((pool) => pool.id === poolId);

  const handlePoolChange = (selectedPoolId) => {
    navigate(`/pool/${selectedPoolId}`);
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <>
      <Header
        currentUser={currentUser}
        token={token}
        pools={pools}
        selectedPoolId={poolId}
        userRole={selectedPool?.role}
        onPoolChange={handlePoolChange}
        onLogout={onLogout}
        onProfile={onProfile}
        onSettings={onSettings}
        onHome={handleHome}
      />
      <DashboardPage
        token={token}
        selectedPoolId={poolId}
        userRole={selectedPool?.role}
        poolRefreshKey={poolRefreshKey}
      />
    </>
  );
}

function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [sessionStatus, setSessionStatus] = useState(token ? 'loading' : 'anonymous');
  const [currentUser, setCurrentUser] = useState(null);
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [poolRefreshKey, setPoolRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const refreshSessionData = useCallback(async ({ silent = false } = {}) => {
    if (!token) {
      setCurrentUser(null);
      setPools([]);
      setSelectedPoolId('');
      setSessionStatus('anonymous');
      return;
    }

    try {
      if (!silent) {
        setSessionStatus('loading');
      }

      const [profile, poolResponse] = await Promise.all([
        apiRequest('/me', { token }),
        apiRequest('/pools', { token }),
      ]);

      const availablePools = poolResponse.pools || [];
      const enrichedPools = await Promise.all(
        availablePools.map(async (pool) => {
          try {
            const [dashboard, claims] = await Promise.all([
              apiRequest(`/pools/${pool.id}/dashboard`, { token }),
              apiRequest(`/pools/${pool.id}/claims`, { token }),
            ]);

            return {
              ...pool,
              totalSpent: dashboard.totalSpent || 0,
              pendingApprovalsCount: (claims.claims || []).filter((claim) => claim.status === 'PENDING').length,
            };
          } catch {
            return {
              ...pool,
              totalSpent: 0,
              pendingApprovalsCount: 0,
            };
          }
        })
      );

      setCurrentUser(profile.user);
      setPools(enrichedPools);
      setSelectedPoolId((currentId) =>
        enrichedPools.some((pool) => pool.id === currentId)
          ? currentId
          : enrichedPools[0]?.id || '',
      );
      setSessionStatus('authenticated');
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setSessionStatus('anonymous');
      setCurrentUser(null);
      setPools([]);
      setSelectedPoolId('');
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    refreshSessionData({ silent: true });

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        refreshSessionData({ silent: true });
      }
    };

    const refreshInterval = window.setInterval(() => {
      refreshSessionData({ silent: true });
    }, 30000);

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [token, refreshSessionData]);

  const handleLogin = async (credentials, isRegistering) => {
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    const result = await apiRequest(endpoint, { method: 'POST', body: credentials });
    window.localStorage.setItem(TOKEN_KEY, result.token);
    setCurrentUser(result.user);
    setToken(result.token);
    setSessionStatus('loading');
  };

  const handleLogout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSessionStatus('anonymous');
    setCurrentUser(null);
    setPools([]);
    setSelectedPoolId('');
    setShowProfile(false);
  };

  const handlePoolCreated = (pool) => {
    setPools((currentPools) => [...currentPools, pool]);
    setSelectedPoolId(pool.id);
    setShowSettings(false);
    refreshSessionData({ silent: true });
  };

  const handlePoolUpdated = (pool) => {
    setPools((currentPools) => currentPools.map((currentPool) => currentPool.id === pool.id ? pool : currentPool));
    setPoolRefreshKey((key) => key + 1);
    refreshSessionData({ silent: true });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            sessionStatus === 'authenticated'
              ? <Navigate to="/" replace />
              : sessionStatus === 'loading'
                ? <div className="app-loading">Loading your account...</div>
                : <Login onLogin={handleLogin} />
          } 
        />

        <Route 
          path="/" 
          element={
            sessionStatus === 'authenticated' ? (
              <HomePage
                token={token}
                currentUser={currentUser}
                pools={pools}
                onLogout={handleLogout}
                onRefresh={() => refreshSessionData({ silent: true })}
              />
            ) : sessionStatus === 'loading' ? (
              <div className="app-loading">Connecting to SplitVault...</div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/pool/:poolId" 
          element={
            sessionStatus === 'authenticated' ? (
              <PoolDashboardWrapper
                currentUser={currentUser}
                pools={pools}
                token={token}
                poolRefreshKey={poolRefreshKey}
                onLogout={handleLogout}
                onProfile={() => setShowProfile(true)}
                onSettings={() => setShowSettings(true)}
              />
            ) : sessionStatus === 'loading' ? (
              <div className="app-loading">Connecting to SplitVault...</div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>

      {sessionStatus === 'authenticated' && showProfile && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}

      {sessionStatus === 'authenticated' && showSettings && (
        <SettingsModal
          key={selectedPoolId}
          token={token}
          selectedPool={pools.find((pool) => pool.id === selectedPoolId)}
          onClose={() => setShowSettings(false)}
          onPoolCreated={handlePoolCreated}
          onPoolUpdated={handlePoolUpdated}
        />
      )}
    </BrowserRouter>
  );
}

export default App;