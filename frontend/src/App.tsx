import React from 'react';
import { UserList } from './components/UserList';
import { AlphabetMenu } from './components/AlphabetMenu';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useUserData } from './hooks/useUserData';
import './styles/animations.css';

const App: React.FC = () => {
  const {
    currentLetter,
    users,
    loading,
    hasMore,
    totalForLetter,
    letterStats,
    error,
    loadMoreUsers,
    changeLetter
  } = useUserData();


  const totalUsers = letterStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fa',
      padding: '0'
    }}>
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #ff8d0aff 0%, #f0c25fff 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              👥
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#1f2937',
                margin: 0,
                lineHeight: 1.2
              }}>
                User Directory
              </h1>
              <p style={{
                fontSize: '13px',
                color: '#6b7280',
                margin: 0
              }}>
                {totalUsers.toLocaleString()} RECORDS
              </p>
            </div>
          </div>
        </div>
      </header>


      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '16px auto',
          padding: '0 32px'
        }}>
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ color: '#991b1b', fontSize: '14px' }}>
              {error}
            </span>
          </div>
        </div>
      )}


      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start'
      }}>

        <aside style={{
          position: 'sticky',
          top: '100px',
          width: '60px',
          flexShrink: 0
        }}>
          {letterStats.length > 0 ? (
            <AlphabetMenu
              currentLetter={currentLetter}
              onLetterClick={changeLetter}
              letterStats={letterStats}
              loading={loading && users.length === 0}
            />
          ) : (
            <LoadingSpinner size="sm" />
          )}
        </aside>


        <main style={{
          flex: 1,
          minWidth: 0
        }}>
          {users.length > 0 || loading ? (
            <UserList
              users={users}
              loading={loading}
              hasMore={hasMore}
              totalForLetter={totalForLetter}
              currentLetter={currentLetter}
              onLoadMore={loadMoreUsers}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default App;