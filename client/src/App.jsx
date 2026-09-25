import { useEffect, useState } from 'react';
import Header from './common/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { clearSession, getDashboard, getPools, getStoredUser, login, saveSession } from './api';
import Login from './pages/Login.jsx';

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getPools()
      .then(({ pools: availablePools }) => {
        setPools(availablePools);
        setSelectedPoolId(availablePools[0]?.id || '');
      })
      .catch((requestError) => setError(requestError.message));
  }, [user]);

  useEffect(() => {
    if (!selectedPoolId) return;
    getDashboard(selectedPoolId)
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message));
  }, [selectedPoolId]);

  async function handleLogin(username, password) {
    const email = username === 'admin' ? 'admin@splitvault.local' : username;
    const session = await login(email, password);
    saveSession(session);
    setUser(session.user);
    setError('');
  }

  function refreshDashboard() {
    if (!selectedPoolId) return;
    getDashboard(selectedPoolId)
      .then(setDashboard)
      .catch((requestError) => setError(requestError.message));
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setPools([]);
    setSelectedPoolId('');
    setDashboard(null);
    setError('');
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <>
      <Header
        selectedPoolId={selectedPoolId}
        pools={pools}
        user={user}
        onPoolChange={setSelectedPoolId}
        onLogout={handleLogout}
      />
      {error && <p className="api-error" role="alert">{error}</p>}
      <DashboardPage dashboard={dashboard} selectedPoolId={selectedPoolId} onClaimSubmitted={refreshDashboard} />
    </>
  );
}

export default App;
