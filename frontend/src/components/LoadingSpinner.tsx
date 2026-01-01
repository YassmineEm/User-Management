import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  text 
}) => {
  const sizes = {
    sm: '20px',
    md: '32px',
    lg: '48px'
  };

  const spinnerSize = sizes[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '24px'
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid rgba(79, 70, 229, 0.1)',
          borderTop: '3px solid #de7b0aff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {text && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: 500
        }}>
          {text}
        </p>
      )}
    </div>
  );
};