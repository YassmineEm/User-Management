import React from 'react';

interface EmptyStateProps {
  letter: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ letter, message }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 10px 25px rgba(79, 70, 229, 0.1)'
      }}>
        <span style={{
          fontSize: '64px',
          fontWeight: 700,
          color: '#de7b0aff',
          opacity: 0.5
        }}>
          {letter}
        </span>
      </div>
      
      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: '#1f2937',
        marginBottom: '8px'
      }}>
        Aucun utilisateur trouvé
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        maxWidth: '400px',
        margin: 0
      }}>
        {message || `Il n'y a aucun utilisateur dont le nom commence par la lettre "${letter}".`}
      </p>
    </div>
  );
};