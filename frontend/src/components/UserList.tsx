import React, { useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface UserListProps {
  users: string[];
  loading: boolean;
  hasMore: boolean;
  totalForLetter: number;
  currentLetter: string;
  onLoadMore: () => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  hasMore,
  currentLetter,
  onLoadMore
}) => {
  const listRef = useRef<List>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [currentLetter]);


  const CONTAINER_HEIGHT = 800;
  const ITEM_HEIGHT = 80;


  const itemCount = hasMore ? users.length + 1 : users.length;


  const isItemLoaded = (index: number) => !hasMore || index < users.length;


  if (users.length === 0 && !loading) {
    return <EmptyState letter={currentLetter} />;
  }


  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '100%',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <LoadingSpinner size="sm" />
          </div>
        </div>
      );
    }

    const username = users[index];

    return (
      <div style={{
        ...style,
        padding: '8px'
      }}>
        <div 
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '16px 20px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.2s',
            cursor: 'default',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#de7b0aff';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >

          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#fff4e0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#de7b0aff',
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0
          }}>
            {username.charAt(0).toUpperCase()}
          </div>

          <div style={{
            flex: 1,
            minWidth: 0
          }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#372c1fff',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {username}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280'
            }}>
              User ID: #{index}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%'
    }}>

      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loading ? () => {} : onLoadMore}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              ref(list);
              (listRef as React.MutableRefObject<List | null>).current = list;
            }}
            height={CONTAINER_HEIGHT}
            itemCount={itemCount}
            itemSize={ITEM_HEIGHT}
            width="100%"
            onItemsRendered={onItemsRendered}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent'
            }}
          >
            {Row}
          </List>
        )}
      </InfiniteLoader>


      {loading && users.length > 0 && (
        <div style={{
          padding: '16px',
          textAlign: 'center'
        }}>
          <LoadingSpinner size="sm" text="Chargement..." />
        </div>
      )}


      {!hasMore && users.length > 0 && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          ✓ Tous les utilisateurs de la lettre <strong>{currentLetter}</strong> ont été chargés
        </div>
      )}
    </div>
  );
};