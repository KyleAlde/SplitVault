import { useEffect, useState } from 'react';
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
  userRole,
  poolRefreshKey,
  onLogout,
  onProfile,
  onSettings,
}) {
  const { poolId } = useParams();
  const navigate = useNavigate();

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
        pools={pools}
        selectedPoolId={poolId}
        onPoolChange={handlePoolChange}
        onLogout={onLogout}
        onProfile={onProfile}
        onSettings={onSettings}
        onHome={handleHome}
      />
      <DashboardPage
        token={token}
        selectedPoolId={poolId}
        userRole={userRole}
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

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    Promise.all([
      apiRequest('/me', { token }),
      apiRequest('/pools', { token }),
    ]).then(([profile, poolResponse]) => {
      if (cancelled) return;
      const availablePools = poolResponse.pools;
      setCurrentUser(profile.user);
      setPools(availablePools);
      setSelectedPoolId((currentId) =>
        availablePools.some((pool) => pool.id === currentId)
          ? currentId
          : availablePools[0]?.id || '',
      );
      setSessionStatus('authenticated');
    }).catch(() => {
      if (cancelled) return;
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setSessionStatus('anonymous');
      setCurrentUser(null);
      setPools([]);
      setSelectedPoolId('');
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

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
  };

  const handlePoolUpdated = (pool) => {
    setPools((currentPools) => currentPools.map((currentPool) => currentPool.id === pool.id ? pool : currentPool));
    setPoolRefreshKey((key) => key + 1);
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
              <HomePage token={token} />
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
                userRole={currentUser?.role}
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