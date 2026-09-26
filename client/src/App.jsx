import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={() => setIsLoggedIn(true)} />
          } 
        />

        <Route 
          path="/*" 
          element={
            isLoggedIn ? (
              <>
                <Header
                  selectedPoolId={selectedPoolId}
                  onPoolChange={setSelectedPoolId}
                  onLogout={() => setIsLoggedIn(false)}
                  onProfile={() => setShowProfile(true)}
                  onSettings={() => setShowSettings(true)}
                />
                
                <Routes>
                  <Route path="/" element={<DashboardPage selectedPoolId={selectedPoolId} />} />
                </Routes>

                {showProfile && (
                  <ProfileModal onClose={() => setShowProfile(false)} />
                )}

                {showSettings && (
                  <SettingsModal onClose={() => setShowSettings(false)} />
                )}
              </>
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