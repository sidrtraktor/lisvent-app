import { useEffect } from 'react';
import { MatchingTable } from './components/MatchingTable';
import { messenger } from './hooks/useMessenger';

function App() {
  useEffect(() => {
    messenger.init();
  }, []);

  return <MatchingTable />;
}

export default App;
