import { useState } from 'react';
import Header from './common/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { budgetPools } from './tempData';

function App() {
  const [selectedPoolId, setSelectedPoolId] = useState(budgetPools[0]?.id || '');

  return (
    <>
      <Header
        selectedPoolId={selectedPoolId}
        onPoolChange={setSelectedPoolId}
      />
      <DashboardPage selectedPoolId={selectedPoolId} />
    </>
  )
}

export default App
