import { useEffect } from 'react';
import { MatchingTable } from './components/MatchingTable';
import { messenger } from './hooks/useMessenger';

function App() {
  useEffect(() => {
    messenger.init();
  }, []);

  return (
    <div className="w-full flex justify-center bg-[#0a0f1e] min-h-screen">
      <div 
        className="w-full max-w-xl flex flex-col"
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}
      >
        <MatchingTable />
      </div>
    </div>
  );
}

export default App;
