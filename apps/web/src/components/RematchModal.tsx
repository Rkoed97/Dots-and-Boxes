import React from 'react';
import Button from './ui/Button';
import Card from './ui/Card';

interface RematchModalProps {
  isOpen: boolean;
  creatorName?: string;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

export default function RematchModal({
  isOpen,
  creatorName,
  onAccept,
  onReject,
  isProcessing,
}: RematchModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <Card
        style={{
          width: '90%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Rematch?</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem' }}>
            {creatorName || 'Opponent'} wants to start a new match.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={onReject}
            disabled={isProcessing}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onAccept}
            disabled={isProcessing}
          >
            {isProcessing ? 'Accepting...' : 'Accept'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
