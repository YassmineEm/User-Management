import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AlphabetMenu } from '../AlphabetMenu';

describe('AlphabetMenu', () => {
  const mockLetterStats = [
    { letter: 'A', count: 100 },
    { letter: 'B', count: 50 },
  ];

  const mockOnLetterClick = vi.fn();

  it('devrait afficher toutes les lettres de A à Z', () => {
    render(
      <AlphabetMenu
        currentLetter="A"
        onLetterClick={mockOnLetterClick}
        letterStats={mockLetterStats}
      />
    );

    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('devrait appeler onLetterClick quand on clique sur une lettre', () => {
    render(
      <AlphabetMenu
        currentLetter="A"
        onLetterClick={mockOnLetterClick}
        letterStats={mockLetterStats}
        loading={false}
      />
    );

    const buttonB = screen.getByRole('button', { name: 'B' });
    fireEvent.click(buttonB);

    expect(mockOnLetterClick).toHaveBeenCalledWith('B');
  });

  it('devrait désactiver les lettres sans utilisateurs', () => {
    render(
      <AlphabetMenu
        currentLetter="A"
        onLetterClick={mockOnLetterClick}
        letterStats={mockLetterStats}
      />
    );

    const buttonZ = screen.getByRole('button', { name: 'Z' });
    expect(buttonZ).toBeDisabled();
  });

  it('devrait désactiver tous les boutons pendant le chargement', () => {
    render(
      <AlphabetMenu
        currentLetter="A"
        onLetterClick={mockOnLetterClick}
        letterStats={mockLetterStats}
        loading={true}
      />
    );

    const buttonB = screen.getByRole('button', { name: 'B' });
    expect(buttonB).toBeDisabled();
  });
});