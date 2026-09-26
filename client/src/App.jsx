import { useState } from 'react';
import Header from './common/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { budgetPools } from './tempData';
import Login from './pages/Login.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';

function App() {
  const [selectedPoolId, setSelectedPoolId] = useState(budgetPools[0]?.id || '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!isLoggedIn) {
    return (
      <Login onLogin={() => setIsLoggedIn(true)} />
    );
  }

  return (
    <>
      <Header
        selectedPoolId={selectedPoolId}
        onPoolChange={setSelectedPoolId}
        onLogout={() => setIsLoggedIn(false)}
        onProfile={() => setShowProfile(true)}
        onSettings={() => setShowSettings(true)}
      />
      <DashboardPage selectedPoolId={selectedPoolId} />

      {showProfile && (
        <ProfileModal 
            onClose={() => setShowProfile(false)} />
      )}

      {showSettings && (
        <SettingsModal 
            onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}

export default App
