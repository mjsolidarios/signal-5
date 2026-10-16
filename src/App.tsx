import React from 'react';
import { GameScene } from './scene/GameScene';
import { useGameStore } from './store/useGameStore';
import { DraftScreen } from './ui/DraftScreen';
import { HalfTimeScreen } from './ui/HalfTimeScreen';
import { HowToPlayModal } from './ui/HowToPlayModal';
import { MatchHUD } from './ui/MatchHUD';
import { ResultsScreen } from './ui/ResultsScreen';
import { TitleScreen } from './ui/TitleScreen';

export const App: React.FC = () => {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="app-shell">
      {/* Keep the 3D barangay island diorama rendered in the background for atmosphere & instant transitions */}
      <GameScene />

      {/* React DOM Overlays */}
      {screen === 'TITLE' && <TitleScreen />}
      {screen === 'HOW_TO_PLAY' && <HowToPlayModal />}
      {screen === 'DRAFT' && <DraftScreen />}
      {screen === 'MATCH' && <MatchHUD />}
      {screen === 'HALF_TIME' && <HalfTimeScreen />}
      {screen === 'RESULTS' && <ResultsScreen />}
    </div>
  );
};

export default App;
