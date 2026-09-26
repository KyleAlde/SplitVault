import { useState } from 'react';
import Header from './common/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { budgetPools } from './tempData';
import Login from './pages/Login.jsx';

function App() {
  const [selectedPoolId, setSelectedPoolId] = useState(budgetPools[0]?.id || '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      />
      <DashboardPage selectedPoolId={selectedPoolId} />
    </>
  )
}

export default App
