import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './common/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import Login from './pages/Login.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { apiRequest } from './api.js';

const TOKEN_KEY = 'splitvault_token';

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
          path="/*" 
          element={
            sessionStatus === 'authenticated' ? (
              <>
                <Header
                  currentUser={currentUser}
                  pools={pools}
                  selectedPoolId={selectedPoolId}
                  onPoolChange={setSelectedPoolId}
                  onLogout={handleLogout}
                  onProfile={() => setShowProfile(true)}
                  onSettings={() => setShowSettings(true)}
                />
                
                <Routes>
                  <Route path="/" element={<DashboardPage token={token} selectedPoolId={selectedPoolId} userRole={currentUser?.role} poolRefreshKey={poolRefreshKey} />} />
                </Routes>

                {showProfile && (
                  <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} />
                )}

                {showSettings && (
                  <SettingsModal
                    key={selectedPoolId}
                    token={token}
                    selectedPool={pools.find((pool) => pool.id === selectedPoolId)}
                    onClose={() => setShowSettings(false)}
                    onPoolCreated={handlePoolCreated}
                    onPoolUpdated={handlePoolUpdated}
                  />
                )}
              </>
            ) : sessionStatus === 'loading' ? (
              <div className="app-loading">Connecting to SplitVault...</div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;