import React from 'react';
import { LetterStat } from '../types';

interface AlphabetMenuProps {
  currentLetter: string;
  onLetterClick: (letter: string) => void;
  letterStats: LetterStat[];
  loading?: boolean;
}

export const AlphabetMenu: React.FC<AlphabetMenuProps> = ({
  currentLetter,
  onLetterClick,
  letterStats,
  loading = false
}) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const statsMap = new Map(
    letterStats.map(stat => [stat.letter, stat.count])
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      background: 'white',
      borderRadius: '8px',
      padding: '8px 6px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      {alphabet.map(letter => {
        const count = statsMap.get(letter) || 0;
        const isActive = letter === currentLetter;
        const hasUsers = count > 0;

        return (
          <button
            key={letter}
            onClick={() => hasUsers && !loading && onLetterClick(letter)}
            disabled={!hasUsers || loading}
            style={{
              padding: '6px 0',
              border: 'none',
              background: isActive ? '#de7b0aff' : 'transparent',
              color: isActive 
                ? 'white' 
                : hasUsers 
                  ? '#1f2937' 
                  : '#d1d5db',
              cursor: hasUsers && !loading ? 'pointer' : 'not-allowed',
              fontWeight: isActive ? 700 : 600,
              fontSize: '13px',
              transition: 'all 0.2s',
              borderRadius: '4px',
              outline: 'none',
              userSelect: 'none',
              width: '100%',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (hasUsers && !isActive && !loading) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (hasUsers && !isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            title={hasUsers 
              ? `${count.toLocaleString()} utilisateur${count > 1 ? 's' : ''}` 
              : 'Aucun utilisateur'
            }
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
};