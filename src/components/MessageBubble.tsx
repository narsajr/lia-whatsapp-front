import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, Reply, MoreHorizontal } from 'lucide-react';
import styled from 'styled-components';
import { Message } from '../types';
import { MessageBubble as StyledMessageBubble, MessageText, MessageTime } from '../styles/GlobalStyle';
import wppAPI from '../services/api';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (message: Message) => void;
  onDownload?: (message: Message) => void;
}

const MessageContainer = styled.div<{ $isOwn: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 2px;
  width: 100%;
`;

const SenderName = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  margin-bottom: 4px;
  padding-left: 12px;
`;

const MediaContainer = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
  min-width: 0;
  width: 100%;
  background-color: ${props => props.theme.colors.textSecondary}20;
`;

const AudioContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  min-width: 200px;
  background-color: ${props => props.theme.colors.surface};
  border-radius: 8px;
`;

const AudioButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.secondary};
  }
`;

const AudioWaveform = styled.div`
  flex: 1;
  height: 32px;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.primary}40 0%, 
    ${props => props.theme.colors.primary}80 50%, 
    ${props => props.theme.colors.primary}40 100%);
  border-radius: 16px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 30%;
    background-color: ${props => props.theme.colors.primary};
    border-radius: 16px;
  }
`;

const AudioDuration = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  min-width: 30px;
`;

const QuotedMessage = styled.div`
  border-left: 4px solid ${props => props.theme.colors.primary};
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: ${props => props.theme.colors.border}40;
  border-radius: 4px;
  font-size: 13px;
`;

const QuotedSender = styled.div`
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  margin-bottom: 2px;
`;

const QuotedText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
`;

const MessageActions = styled.div`
  position: absolute;
  top: -10px;
  right: 10px;
  background-color: ${props => props.theme.colors.surface};
  border-radius: 20px;
  padding: 4px;
  display: flex;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
  }
`;

const BubbleWrapper = styled.div`
  position: relative;
  
  &:hover ${MessageActions} {
    opacity: 1;
    pointer-events: all;
  }
`;

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSender = false,
  onReply,
  onDownload
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Helper to get message text content
  const getMessageContent = (message: Message): string => {
    return message.content || message.body || '';
  };

  // Helper to get message timestamp
  const getMessageTimestamp = (message: Message): number => {
    return message.timestamp || message.t;
  };

  // Helper to create data URL from base64
  const createDataUrl = (base64: string, mimetype: string): string => {
    if (base64.startsWith('data:')) {
      return base64;
    }
    return `data:${mimetype};base64,${base64}`;
  };

  // Helper to check if URL is valid base64 data
  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.startsWith('data:')) return true;
    if (url.startsWith('http')) return true;
    if (url.startsWith('blob:')) return true;
    return false;
  };

  // Fetch media from server
  const fetchMediaFromServer = async (messageId: string) => {
    if (!messageId || isLoadingMedia) return;

    setIsLoadingMedia(true);
    setMediaError(false);

    try {
      const response = await wppAPI.getMediaByMessage(messageId);
      if (response.status === 'success' && response.response) {
        const { base64, mimetype } = response.response;
        const dataUrl = createDataUrl(base64, mimetype);
        setMediaUrl(dataUrl);
      } else {
        setMediaError(true);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      setMediaError(true);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Effect to handle media URL resolution
  useEffect(() => {
    if (!message || !['image', 'video', 'sticker'].includes(message.type)) {
      return;
    }

    // First, try to use the direct media URL endpoint
    if (message.id && wppAPI.getCurrentSession()) {
      const directUrl = wppAPI.getMediaUrl(message.id);
      setMediaUrl(directUrl);
      return;
    }

    // Check if we already have a valid URL
    const existingUrl = message.clientUrl || message.deprecatedMms3Url;
    
    if (existingUrl && isValidUrl(existingUrl)) {
      setMediaUrl(existingUrl);
      return;
    }

    // If the existing URL looks like raw base64 data, try to format it
    if (existingUrl && existingUrl.length > 100 && !existingUrl.includes('data:') && message.mimetype) {
      const dataUrl = createDataUrl(existingUrl, message.mimetype);
      setMediaUrl(dataUrl);
      return;
    }

    // As last resort, try to fetch base64 from server
    if (message.id) {
      fetchMediaFromServer(message.id);
    }
  }, [message]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioPlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback
  };

  const renderQuotedMessage = () => {
    if (!message.quotedMsg && !message.quotedMsgObj) return null;
    
    const quoted = message.quotedMsg || message.quotedMsgObj;
    
    return (
      <QuotedMessage>
        <QuotedSender>
          {quoted?.senderName || 'Contato'}
        </QuotedSender>
        <QuotedText>
          {quoted?.body || 'Mensagem de mídia'}
        </QuotedText>
      </QuotedMessage>
    );
  };

  const renderMediaContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <MediaContainer>
            {isLoadingMedia ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>🔄</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Carregando imagem...</div>
              </div>
            ) : mediaError ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Imagem não disponível</div>
                <button
                  onClick={() => fetchMediaFromServer(message.id)}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    background: 'none',
                    border: '1px solid currentColor',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: 0.7
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : mediaUrl ? (
              <img
                src={mediaUrl}
                alt="Imagem"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={() => {
                  setMediaError(true);
                  setMediaUrl(null);
                }}
              />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Imagem</div>
              </div>
            )}
            {message.caption && (
              <div style={{ padding: '8px' }}>
                <MessageText>{message.caption}</MessageText>
              </div>
            )}
          </MediaContainer>
        );

      case 'video':
        return (
          <MediaContainer>
            {isLoadingMedia ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>🔄</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Carregando vídeo...</div>
              </div>
            ) : mediaError ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>🎥</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Vídeo não disponível</div>
                <button
                  onClick={() => fetchMediaFromServer(message.id)}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    background: 'none',
                    border: '1px solid currentColor',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: 0.7
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : mediaUrl ? (
              <video
                src={mediaUrl}
                controls
                style={{ width: '100%', maxHeight: '300px' }}
                onError={() => {
                  setMediaError(true);
                  setMediaUrl(null);
                }}
              />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>🎥</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Vídeo</div>
              </div>
            )}
            {message.caption && (
              <div style={{ padding: '8px' }}>
                <MessageText>{message.caption}</MessageText>
              </div>
            )}
          </MediaContainer>
        );

      case 'audio':
      case 'ptt':
        return (
          <AudioContainer>
            <AudioButton onClick={handleAudioPlay}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </AudioButton>
            <AudioWaveform />
            <AudioDuration>
              {message.body || '0:00'}
            </AudioDuration>
          </AudioContainer>
        );

      case 'document':
        return (
          <MediaContainer>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#00a884',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                flexShrink: 0
              }}>
                📄
              </div>
              <div style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden'
              }}>
                <div style={{
                  fontWeight: '500',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  wordBreak: 'break-all'
                }}>
                  {message.filename || 'Documento'}
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {message.mimetype || 'Arquivo'}
                </div>
              </div>
              {onDownload && (
                <ActionButton onClick={() => onDownload(message)} style={{ flexShrink: 0 }}>
                  <Download size={16} />
                </ActionButton>
              )}
            </div>
          </MediaContainer>
        );

      case 'sticker':
        return (
          <div style={{ background: 'transparent' }}>
            {isLoadingMedia ? (
              <div style={{ width: '128px', height: '128px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ marginBottom: '4px' }}>🔄</div>
                <div style={{ fontSize: '8px', opacity: 0.7 }}>Carregando...</div>
              </div>
            ) : mediaError ? (
              <div style={{ width: '128px', height: '128px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ marginBottom: '4px' }}>🎭</div>
                <button
                  onClick={() => fetchMediaFromServer(message.id)}
                  style={{
                    padding: '2px 4px',
                    fontSize: '8px',
                    background: 'none',
                    border: '1px solid currentColor',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    opacity: 0.7
                  }}
                >
                  Recarregar
                </button>
              </div>
            ) : mediaUrl ? (
              <img
                src={mediaUrl}
                alt="Figurinha"
                style={{ width: '128px', height: '128px' }}
                onError={() => {
                  setMediaError(true);
                  setMediaUrl(null);
                }}
              />
            ) : (
              <div style={{ width: '128px', height: '128px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🎭
              </div>
            )}
          </div>
        );

      case 'location':
        return (
          <MediaContainer>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
              <div>Localização compartilhada</div>
            </div>
          </MediaContainer>
        );

      default:
        return null;
    }
  };

  const renderTextContent = () => {
    const content = getMessageContent(message);
    if (!content && message.type === 'chat') return null;
    if (message.type === 'revoked') {
      return (
        <MessageText style={{ fontStyle: 'italic', opacity: 0.7 }}>
          Esta mensagem foi apagada
        </MessageText>
      );
    }
    
    if (content) {
      return <MessageText>{content}</MessageText>;
    }
    
    return null;
  };

  if (message.type === 'sticker') {
    return (
      <MessageContainer $isOwn={isOwn}>
        {showSender && !isOwn && (
          <SenderName>{message.senderName}</SenderName>
        )}
        {renderMediaContent()}
      </MessageContainer>
    );
  }

  return (
    <MessageContainer $isOwn={isOwn}>
      {showSender && !isOwn && (
        <SenderName>{message.senderName}</SenderName>
      )}
      
      <BubbleWrapper>
        <StyledMessageBubble $isOwn={isOwn}>
          {renderQuotedMessage()}
          {renderMediaContent()}
          {renderTextContent()}
          
          <MessageTime>
            {formatTime(getMessageTimestamp(message))}
            {isOwn && (
              <span style={{ marginLeft: '4px' }}>
                {message.ack === 3 ? '✓✓' : message.ack === 2 ? '✓' : '⏱️'}
              </span>
            )}
          </MessageTime>
        </StyledMessageBubble>

        <MessageActions>
          {onReply && (
            <ActionButton onClick={() => onReply(message)} title="Responder">
              <Reply size={14} />
            </ActionButton>
          )}
          <ActionButton title="Mais opções">
            <MoreHorizontal size={14} />
          </ActionButton>
        </MessageActions>
      </BubbleWrapper>
    </MessageContainer>
  );
};

export default MessageBubble;