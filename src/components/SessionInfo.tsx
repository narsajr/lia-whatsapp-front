import React from 'react';
import { Info } from 'lucide-react';

interface SessionInfoProps {
  sessionId?: string;
  onCopy?: () => void;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ sessionId, onCopy }) => {
  const handleCopySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      onCopy && onCopy();
    }
  };

  if (!sessionId) return null;

  // Truncate session ID for display
  const displaySessionId = sessionId.length > 30 
    ? `${sessionId.substring(0, 15)}...${sessionId.substring(sessionId.length - 10)}`
    : sessionId;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <Info size={16} />
      <span>ID da Sessão:</span>
      <code 
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'all'
        }}
        onClick={handleCopySessionId}
        title={`Clique para copiar: ${sessionId}`}
      >
        {displaySessionId}
      </code>
    </div>
  );
};

export default SessionInfo;