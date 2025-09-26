import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MoreVertical, Phone, Video, Smile, Paperclip, Mic, Send, X } from 'lucide-react';
import styled from 'styled-components';
// @ts-ignore
import MicRecorder from 'mic-recorder-to-mp3';
import { toast } from 'react-toastify';
import {
  ChatArea as StyledChatArea,
  Header,
  IconButton,
  MessageContainer,
  MessageInput,
  InputField,
  SendButton
} from '../styles/GlobalStyle';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import { Chat, Message, Contact } from '../types';

interface ChatAreaProps {
  chat?: Chat;
  messages: Message[];
  currentUser?: Contact;
  onSendMessage: (text: string, replyTo?: Message) => void;
  onSendFile: (file: File, caption?: string) => void;
  onSendVoice: (audioBlob: Blob) => void;
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  width: 320px;
  height: 200px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Cpath d='M85.5 100.5c0-32.8 26.7-59.5 59.5-59.5s59.5 26.7 59.5 59.5-26.7 59.5-59.5 59.5-59.5-26.7-59.5-59.5z' fill='%2300a884' opacity='.1'/%3E%3Cpath d='M145 85.5c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15z' fill='%2300a884'/%3E%3C/svg%3E") center/contain no-repeat;
  margin-bottom: 24px;
  opacity: 0.6;
`;

const ChatHeader = styled(Header)`
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.border}20;
  }
`;

const ChatTitle = styled.div`
  flex: 1;
`;

const ChatName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const ChatStatus = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
`;

const MessagesWrapper = styled.div`
  padding: 12px 80px;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  color: ${props => props.theme.colors.primary};
  border: none;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.theme.colors.border}20;
  }
`;

const ReplyPreview = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-left: 4px solid ${props => props.theme.colors.primary};
  padding: 12px 16px;
  margin: 0 12px 8px;
  border-radius: 0 8px 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ReplyContent = styled.div`
  flex: 1;
`;

const ReplyTitle = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  margin-bottom: 2px;
`;

const ReplyText = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
`;

const CloseReplyButton = styled(IconButton)`
  width: 24px;
  height: 24px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const FileInput = styled.input`
  display: none;
`;

const VoiceRecordingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background-color: ${props => props.theme.colors.primary}20;
  border-radius: 24px;
  height: 40px;
  flex: 1;
`;

const RecordingDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${props => props.theme.colors.danger};
  border-radius: 50%;
  animation: pulse 1s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const RecordingTime = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  flex: 1;
`;

const CancelRecordingButton = styled(IconButton)`
  color: ${props => props.theme.colors.danger};
`;

const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onSendFile,
  onSendVoice,
  onLoadMore,
  isLoading,
  hasMore
}) => {
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<any>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    recorderRef.current = new MicRecorder({ bitRate: 128 });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to safely extract chat ID as string
  const getChatId = (chat: Chat): string => {
    if (typeof chat.id === 'string') {
      return chat.id;
    }
    // If id is an object, try to get _serialized property
    if (chat.id && typeof chat.id === 'object' && '_serialized' in chat.id) {
      return (chat.id as any)._serialized;
    }
    return String(chat.id || '');
  };

  // Helper function to format chat ID for display
  const formatChatIdForDisplay = (chat: Chat): string => {
    const id = getChatId(chat);
    return id.replace(/[@c.us,@g.us]/g, '');
  };

  const getStatusText = (chat: Chat): string => {
    if (chat.isGroup) {
      const memberCount = chat.groupMetadata?.participants?.length || 0;
      return `${memberCount} participantes`;
    }
    
    if (chat.isOnline) {
      return 'online';
    }
    
    if (chat.lastSeen) {
      const lastSeenDate = new Date(chat.lastSeen * 1000);
      const now = new Date();
      const diffTime = now.getTime() - lastSeenDate.getTime();
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      
      if (diffMinutes < 1) {
        return 'online';
      } else if (diffMinutes < 60) {
        return `visto por último há ${diffMinutes} minutos`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
          return `visto por último há ${diffHours} horas`;
        } else {
          return `visto por último ${lastSeenDate.toLocaleDateString('pt-BR')}`;
        }
      }
    }
    
    return '';
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim(), replyingTo);
      setMessageText('');
      setReplyingTo(undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await recorderRef.current?.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao acessar o microfone');
    }
  };

  const stopRecording = async () => {
    try {
      const [, blob] = await recorderRef.current!.stop().getMp3();
      setIsRecording(false);
      
      if (recordingTime >= 1) {
        onSendVoice(blob);
      } else {
        toast.warning('Gravação muito curta');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
  }, []);

  if (!chat) {
    return (
      <StyledChatArea>
        <EmptyState>
          <EmptyIcon />
          <h2>WhatsApp Web</h2>
          <p>Agora você pode enviar e receber mensagens sem precisar manter o seu telefone conectado.</p>
          <p>Use o WhatsApp em até 4 dispositivos conectados e 1 telefone ao mesmo tempo.</p>
        </EmptyState>
      </StyledChatArea>
    );
  }

  return (
    <StyledChatArea>
      <ChatHeader>
        <Avatar
          contact={chat.contact}
          contactId={getChatId(chat)}
          size={40}
          alt={chat.name || getChatId(chat)}
        />
        
        <ChatTitle>
          <ChatName>
            {chat.name || formatChatIdForDisplay(chat)}
          </ChatName>
          <ChatStatus>
            {getStatusText(chat)}
          </ChatStatus>
        </ChatTitle>

        <IconButton>
          <Search size={20} />
        </IconButton>
        <IconButton>
          <Phone size={20} />
        </IconButton>
        <IconButton>
          <Video size={20} />
        </IconButton>
        <IconButton>
          <MoreVertical size={20} />
        </IconButton>
      </ChatHeader>

      <MessageContainer>
        <MessagesWrapper>
          {hasMore && !isLoading && (
            <LoadMoreButton onClick={onLoadMore}>
              Carregar mensagens anteriores
            </LoadMoreButton>
          )}
          
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              Carregando mensagens...
            </div>
          )}

          {messages.map((message, index) => {
            const isOwn = message.fromMe;
            // Get sender name from different possible sources
            const getSenderName = (msg: Message) => {
              return msg.senderName || msg.sender?.name || msg.sender?.pushname || 'Contato';
            };
            
            const showSender = !isOwn && chat.isGroup &&
              (index === 0 || messages[index - 1].author !== message.author);
            
            // Ensure message has the senderName property set
            const messageWithSender = {
              ...message,
              senderName: getSenderName(message)
            };
            
            return (
              <MessageBubble
                key={`${message.id}-${index}`}
                message={messageWithSender}
                isOwn={isOwn}
                showSender={showSender}
                onReply={handleReply}
              />
            );
          })}
          
          <div ref={messagesEndRef} />
        </MessagesWrapper>
      </MessageContainer>

      {replyingTo && (
        <ReplyPreview>
          <ReplyContent>
            <ReplyTitle>
              {replyingTo.fromMe ? 'Você' : replyingTo.senderName || 'Contato'}
            </ReplyTitle>
            <ReplyText>
              {replyingTo.body || 'Mensagem de mídia'}
            </ReplyText>
          </ReplyContent>
          <CloseReplyButton onClick={() => setReplyingTo(undefined)}>
            <X size={16} />
          </CloseReplyButton>
        </ReplyPreview>
      )}

      <MessageInput>
        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <Smile size={20} />
        </IconButton>
        
        <IconButton onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={20} />
        </IconButton>
        
        <FileInput
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,application/*"
        />

        {isRecording ? (
          <VoiceRecordingContainer>
            <RecordingDot />
            <RecordingTime>{formatRecordingTime(recordingTime)}</RecordingTime>
            <CancelRecordingButton onClick={cancelRecording}>
              <X size={20} />
            </CancelRecordingButton>
          </VoiceRecordingContainer>
        ) : (
          <InputContainer>
            <InputField
              type="text"
              placeholder="Digite uma mensagem"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </InputContainer>
        )}

        {messageText.trim() ? (
          <SendButton onClick={handleSendMessage}>
            <Send size={20} />
          </SendButton>
        ) : (
          <IconButton 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            <Mic size={20} />
          </IconButton>
        )}
      </MessageInput>
    </StyledChatArea>
  );
};

export default ChatArea;