import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { GlobalStyle, Container } from './styles/GlobalStyle';
import { darkTheme } from './styles/theme';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import UserSettings from './components/UserSettings';
import wppAPI from './services/api';

import { 
  Chat, 
  Contact, 
  Message, 
  SessionStatus, 
  ChatUIState 
} from './types';

const App: React.FC = () => {
  // Authentication state
  const [session, setSession] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    status: 'CLOSED'
  });
  const [qrCode, setQrCode] = useState<string>('');
  
  // Data state
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUser, setCurrentUser] = useState<Contact>();
  
  // UI state
  const [uiState, setUIState] = useState<ChatUIState>({
    selectedChat: undefined,
    messages: [],
    isLoading: false,
    isRecording: false,
    recordingTime: 0,
    showEmojiPicker: false,
    messageInput: '',
    searchQuery: '',
    filteredChats: []
  });

  // Settings state
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Initialize session on mount
  const initializeSession = useCallback(() => {
    const storedSession = localStorage.getItem('wpp_session') || 'default';
    const storedToken = localStorage.getItem('wpp_token');
    
    setSession(storedSession);
    
    if (storedToken) {
      wppAPI.setSession(storedSession, storedToken);
      checkConnectionWithSession(storedSession);
    } else {
      // Start authentication flow
      startSessionWithSession(storedSession);
    }
  }, []);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // WebSocket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const cleanupMessage = wppAPI.onMessage((message: Message) => {
      // Get chat ID as string from message
      const getChatIdFromMessage = (msg: Message): string => {
        if (typeof msg.chatId === 'string') {
          return msg.chatId;
        }
        if (msg.chatId && typeof msg.chatId === 'object' && '_serialized' in msg.chatId) {
          return (msg.chatId as any)._serialized;
        }
        return String(msg.chatId || '');
      };

      const chatId = getChatIdFromMessage(message);
      const messageTimestamp = message.timestamp || message.t;

      // Update chat list with new message
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(chat => {
          const existingChatId = typeof chat.id === 'string' ? chat.id : (chat.id as any)?._serialized || String(chat.id);
          return existingChatId === chatId;
        });
        
        if (chatIndex >= 0) {
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: message,
            timestamp: messageTimestamp,
            unreadCount: message.fromMe ? 0 : updatedChats[chatIndex].unreadCount + 1
          };
          
          // Move to top
          const [updatedChat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(updatedChat);
        }
        
        return updatedChats;
      });

      // Update messages if chat is selected
      setUIState(prev => {
        const selectedChatId = typeof prev.selectedChat?.id === 'string'
          ? prev.selectedChat.id
          : (prev.selectedChat?.id as any)?._serialized || String(prev.selectedChat?.id || '');
        
        if (selectedChatId === chatId) {
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        }
        return prev;
      });

      // Show notification for new messages
      if (!message.fromMe) {
        console.log(message)
        const senderName = message.senderName || message.sender?.name || message.sender?.pushname || 'Contato';
        toast.info(`Nova mensagem de ${senderName}`);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {
          // Ignore if audio fails to play
        });
      }
    });

    const cleanupStatus = wppAPI.onConnectionStatus((status: boolean) => {
      setIsAuthenticated(status);
      if (!status) {
        toast.error('Conexão perdida com o WhatsApp');
      }
    });

    return () => {
      cleanupMessage();
      cleanupStatus();
    };
  }, [isAuthenticated]);

  const startSessionWithSession = async (sessionName: string) => {
    try {
      console.log('Starting session with name:', sessionName);
      setUIState(prev => ({ ...prev, isLoading: true }));
      
      // First generate token
      const secretKey = 'THISISMYSECURETOKEN'; // In production, this should be from environment
      const tokenResponse = await wppAPI.generateToken(sessionName, secretKey);
      console.log('Token generated:', JSON.stringify(tokenResponse, null, 2));
      
      if (tokenResponse.token) {
        localStorage.setItem('wpp_token', tokenResponse.token);
        wppAPI.setSession(sessionName, tokenResponse.token);
        
        // Start session
        const sessionResponse = await wppAPI.startSession(sessionName, true);
        console.log('Session started:', JSON.stringify(sessionResponse, null, 2));
        setSessionStatus(sessionResponse);
        
        // Get QR code if needed - check for any status that might need QR code
        if (sessionResponse.status === 'AUTHENTICATING' || sessionResponse.status === 'INITIALIZING' || sessionResponse.qrcode) {
          console.log('Getting QR code for authentication, status:', sessionResponse.status);
          if (sessionResponse.qrcode) {
            // Use QR code from response if available
            setQrCode(sessionResponse.qrcode);
          } else {
            await getQRCodeWithSession(sessionName);
          }
        }
        
        // If session is already ready or connected, set authenticated immediately
        if (sessionResponse.status === 'READY' || sessionResponse.status === 'CONNECTED') {
          console.log(`Session is already ${sessionResponse.status.toLowerCase()}, authenticating immediately`);
          setIsAuthenticated(true);
          // Add a small delay to ensure WhatsApp is fully synchronized
          setTimeout(() => {
            loadInitialData();
          }, 1000);
          return;
        }
        
        // Check status periodically - only if not already ready
        // Always start status polling since session might transition to READY
        {
          let statusCheckCount = 0;
          const maxStatusChecks = 60; // Maximum 3 minutes of checking
          const statusInterval = setInterval(async () => {
            try {
              statusCheckCount++;
              console.log(`Status check #${statusCheckCount}`);
              
              const status = await wppAPI.getSessionStatus(sessionName);
              console.log('Current session status:', JSON.stringify(status, null, 2));
              setSessionStatus(status);
              
              // Update QR code if it changes
              if (status.qrcode && status.qrcode !== qrCode) {
                setQrCode(status.qrcode);
              }
              
              if (status.status === 'READY' || status.status === 'CONNECTED') {
                console.log(`Session is ${status.status.toLowerCase()}! Setting authenticated to true`);
                clearInterval(statusInterval);
                setIsAuthenticated(true);
                // Add a small delay to ensure WhatsApp is fully synchronized
                setTimeout(() => {
                  loadInitialData();
                }, 1000);
              } else if (status.status === 'CLOSED' || statusCheckCount >= maxStatusChecks) {
                console.log('Session failed or timed out, stopping status checks');
                clearInterval(statusInterval);
                if (statusCheckCount >= maxStatusChecks) {
                  toast.error('Timeout na autenticação. Tente novamente.');
                } else if (status.status === 'CLOSED') {
                  toast.error('Sessão foi fechada. Tente novamente.');
                }
              }
            } catch (error) {
              console.error('Status check failed:', error);
              statusCheckCount++;
              if (statusCheckCount >= maxStatusChecks) {
                clearInterval(statusInterval);
                toast.error('Erro na verificação do status da sessão');
              }
            }
          }, 3000);
        }
        
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Erro ao iniciar sessão');
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getQRCodeWithSession = async (sessionName: string) => {
    try {
      const qrBlob = await wppAPI.getQRCode(sessionName);
      const qrUrl = URL.createObjectURL(qrBlob);
      setQrCode(qrUrl);
    } catch (error) {
      console.error('Failed to get QR code:', error);
    }
  };

  const checkConnectionWithSession = async (sessionName: string) => {
    try {
      console.log('Checking connection for session:', sessionName);
      const response = await wppAPI.checkConnection(sessionName);
      console.log('Connection check response:', JSON.stringify(response, null, 2));
      
      if (response.response && response.response.status) {
        console.log('Connection is active, setting authenticated to true');
        setIsAuthenticated(true);
        // Add a small delay to ensure WhatsApp is fully synchronized
        setTimeout(() => {
          loadInitialData();
        }, 1000);
      } else {
        console.log('Connection is not active, starting new session');
        setIsAuthenticated(false);
        // Start authentication flow if connection is not active
        startSessionWithSession(sessionName);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      console.log('Connection check failed, starting new session');
      setIsAuthenticated(false);
      // Start authentication flow on error
      startSessionWithSession(sessionName);
    }
  };

  // Helper function to validate chat ID format
  const isValidChatId = useCallback((chatId: string): boolean => {
    if (!chatId || typeof chatId !== 'string') return false;
    
    // Valid WhatsApp ID patterns:
    // - Individual: number@c.us (e.g., 5521999999999@c.us)
    // - Group: number-timestamp@g.us (e.g., 123456789-987654321@g.us)
    // - Clean numbers: just numbers (will be processed later)
    
    // Check if it's already properly formatted
    if (chatId.includes('@c.us') || chatId.includes('@g.us')) {
      return /^[\d-]+@[cg]\.us$/.test(chatId);
    }
    
    // Check if it's a clean number/ID that can be formatted
    // Should be numeric, possibly with dashes for groups, and reasonable length
    if (/^\d+(-\d+)?$/.test(chatId)) {
      // Individual numbers should be between 10-15 digits
      // Group IDs can be longer and contain dashes
      const cleanNumber = chatId.replace(/-.*/, ''); // Get first part for groups
      return cleanNumber.length >= 10 && cleanNumber.length <= 15;
    }
    
    return false;
  }, []);

  // Helper function to normalize chat ID
  const normalizeChatId = (chat: Chat): string => {
    let id: string;
    
    if (typeof chat.id === 'string') {
      id = chat.id;
    } else if (chat.id && typeof chat.id === 'object' && '_serialized' in chat.id) {
      id = (chat.id as any)._serialized;
    } else {
      id = String(chat.id || '');
    }
    
    // If already formatted, return as is
    if (id.includes('@')) {
      return id;
    }
    
    // Format based on group status
    if (chat.isGroup && !id.includes('@g.us')) {
      return `${id}@g.us`;
    } else if (!chat.isGroup && !id.includes('@c.us')) {
      return `${id}@c.us`;
    }
    
    return id;
  };

  const loadInitialData = async (retryAttempt = 0) => {
    const maxRetries = 2;
    const baseDelay = 3000; // 3 seconds base delay
    
    try {
      console.log(`Loading initial data (attempt ${retryAttempt + 1})...`);
      setUIState(prev => ({ ...prev, isLoading: true }));
      
      // Add a small delay to let WhatsApp fully initialize after connection
      if (retryAttempt === 0) {
        console.log('Waiting for WhatsApp to fully initialize...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Load contacts first, then chats (contacts are usually faster and more reliable)
      console.log('Fetching contacts...');
      const contactsResponse = await wppAPI.getAllContacts();
      console.log('Contacts response:', contactsResponse);
      
      // Process contacts first
      if (contactsResponse.response) {
        const myContacts = contactsResponse.response.filter(
          (contact: Contact) => {
            // Filter out contacts with problematic IDs
            const contactId = contact.id._serialized;
            
            // Skip @lid contacts as they often cause issues
            if (contactId.includes('@lid')) {
              console.warn('Filtering out @lid contact:', contactId);
              return false;
            }
            
            // Only include contacts that are in our contact list and have a valid user ID
            return contact.isMyContact && contact.id.user && contactId;
          }
        );
        console.log('My contacts count:', myContacts.length);
        setContacts(myContacts);
        
        // Find current user
        const me = contactsResponse.response.find((contact: Contact) => contact.isMe);
        if (me) {
          console.log('Current user found:', me.name || me.pushname);
          setCurrentUser(me);
        }
      }
      
      // Now load chats with retry logic
      console.log('Fetching chats...');
      const chatsResponse = await wppAPI.getAllChats();
      console.log('Chats response:', chatsResponse);
      
      if (chatsResponse.status === 'error' && retryAttempt < maxRetries) {
        console.log(`Chats loading failed, retrying in ${baseDelay * (retryAttempt + 1)}ms...`);
        setTimeout(() => {
          loadInitialData(retryAttempt + 1);
        }, baseDelay * (retryAttempt + 1));
        return;
      }
      
      if (chatsResponse.response && Array.isArray(chatsResponse.response)) {
        const processedChats = chatsResponse.response
          .filter((chat: Chat) => {
            if (!chat || chat.archived) return false;
            
            // Normalize and validate chat ID
            const normalizedId = normalizeChatId(chat);
            const cleanId = normalizedId.replace(/[@c.us,@g.us]/g, '');
            
            if (!isValidChatId(cleanId)) {
              console.warn('Invalid chat ID filtered out:', normalizedId, chat);
              return false;
            }
            
            return true;
          })
          .map((chat: Chat) => ({
            ...chat,
            id: normalizeChatId(chat), // Ensure ID is normalized
            lastMessage: chat.msgs && chat.msgs.length > 0
              ? chat.msgs[chat.msgs.length - 1]
              : undefined
          }))
          .sort((a: Chat, b: Chat) => (b.timestamp || 0) - (a.timestamp || 0));
        
        console.log('Processed chats count:', processedChats.length);
        setChats(processedChats);
        
        if (processedChats.length === 0 && retryAttempt < maxRetries) {
          console.log('No chats loaded, this might be a timing issue. Retrying...');
          setTimeout(() => {
            loadInitialData(retryAttempt + 1);
          }, baseDelay * (retryAttempt + 1));
          return;
        }
      } else {
        console.log('No chats found or invalid response format');
        setChats([]);
        
        if (retryAttempt < maxRetries) {
          console.log('Invalid chats response, retrying...');
          setTimeout(() => {
            loadInitialData(retryAttempt + 1);
          }, baseDelay * (retryAttempt + 1));
          return;
        }
      }
      
      console.log('Initial data loaded successfully');
      
      // Show success message only if we actually loaded some chats or this is not the first attempt
      if (retryAttempt > 0) {
        toast.success('Dados carregados com sucesso');
      }
      
    } catch (error) {
      console.error(`Failed to load initial data (attempt ${retryAttempt + 1}):`, error);
      
      if (retryAttempt < maxRetries) {
        console.log(`Retrying initial data load in ${baseDelay * (retryAttempt + 1)}ms...`);
        setTimeout(() => {
          loadInitialData(retryAttempt + 1);
        }, baseDelay * (retryAttempt + 1));
        return;
      }
      
      toast.error('Erro ao carregar dados após várias tentativas');
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleChatSelect = useCallback(async (chat: Chat) => {
    // Validate chat ID before proceeding
    const chatId = typeof chat.id === 'string' ? chat.id : String(chat.id);
    const cleanId = chatId.replace(/[@c.us,@g.us]/g, '');
    
    if (!isValidChatId(cleanId)) {
      console.error('Invalid chat ID, cannot load messages:', chatId);
      toast.error('Chat inválido, não é possível carregar mensagens');
      return;
    }

    setUIState(prev => ({ ...prev, selectedChat: chat, isLoading: true }));
    
    try {
      const messagesResponse = await wppAPI.getChatById(chat.id, chat.isGroup);
      
      // Check if the response indicates an error (like chat not found)
      if (messagesResponse.status === 'error') {
        console.warn('Chat not found or not accessible:', chat.id);
        setUIState(prev => ({
          ...prev,
          messages: [],
          isLoading: false
        }));
        toast.warn('Chat não encontrado ou não acessível');
        return;
      }
      
      setUIState(prev => ({
        ...prev,
        messages: messagesResponse.response || [],
        isLoading: false
      }));
      
      // Mark as seen (only if messages were loaded successfully)
      if (messagesResponse.response) {
        try {
          await wppAPI.sendSeen(chat.id);
        } catch (seenError) {
          // Don't show error for seen status as it's not critical
          console.warn('Could not mark chat as seen:', seenError);
        }
      }
      
      // Update unread count
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === chat.id ? { ...c, unreadCount: 0 } : c
        )
      );
      
    } catch (error: any) {
      console.error('Failed to load chat messages:', error);
      
      // More specific error handling
      if (error.response?.status === 404) {
        toast.warn('Chat não encontrado ou foi removido');
        // Optionally remove invalid chat from the list
        setChats(prevChats => prevChats.filter(c => c.id !== chat.id));
      } else if (error.response?.status === 401) {
        toast.error('Erro de autenticação. Tente fazer login novamente.');
      } else {
        toast.error('Erro ao carregar mensagens');
      }
      
      setUIState(prev => ({ ...prev, isLoading: false, messages: [] }));
    }
  }, [isValidChatId]);

  const handleSendMessage = useCallback(async (text: string, replyTo?: Message) => {
    if (!uiState.selectedChat) return;
    
    try {
      if (replyTo) {
        await wppAPI.sendReply(
          uiState.selectedChat.id,
          text,
          replyTo.id,
          uiState.selectedChat.isGroup
        );
      } else {
        await wppAPI.sendMessage({
          phone: uiState.selectedChat.id,
          message: text,
          isGroup: uiState.selectedChat.isGroup
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  }, [uiState.selectedChat]);

  const handleSendFile = useCallback(async (file: File, caption?: string) => {
    if (!uiState.selectedChat) return;
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        await wppAPI.sendFile({
          phone: uiState.selectedChat!.id,
          base64,
          filename: file.name,
          caption,
          isGroup: uiState.selectedChat!.isGroup
        });
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Failed to send file:', error);
      toast.error('Erro ao enviar arquivo');
    }
  }, [uiState.selectedChat]);

  const handleSendVoice = useCallback(async (audioBlob: Blob) => {
    if (!uiState.selectedChat) return;
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        await wppAPI.sendVoice({
          phone: uiState.selectedChat!.id,
          base64Ptt: base64
        });
      };
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Failed to send voice:', error);
      toast.error('Erro ao enviar áudio');
    }
  }, [uiState.selectedChat]);

  const handleLoadMore = useCallback(async () => {
    if (!uiState.selectedChat) return;
    
    try {
      const response = await wppAPI.loadEarlierMessages(
        uiState.selectedChat.id, 
        uiState.selectedChat.isGroup
      );
      
      if (response.response && Array.isArray(response.response)) {
        setUIState(prev => ({
          ...prev,
          messages: [...response.response, ...prev.messages]
        }));
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [uiState.selectedChat]);

  const handleSearchChange = useCallback((query: string) => {
    setUIState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await wppAPI.logout({ force: false, clearData: true });
      setIsAuthenticated(false);
      setSession('');
      setCurrentUser(undefined);
      setChats([]);
      setContacts([]);
      setUIState({
        selectedChat: undefined,
        messages: [],
        isLoading: false,
        isRecording: false,
        recordingTime: 0,
        showEmojiPicker: false,
        messageInput: '',
        searchQuery: '',
        filteredChats: []
      });
      setShowSettings(false);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Erro ao fazer logout');
    }
  }, []);

  const handleCloseSession = useCallback(async () => {
    try {
      await wppAPI.terminateSession({ type: 'close', clearData: false });
      setIsAuthenticated(false);
      setShowSettings(false);
      toast.success('Sessão fechada com sucesso');
      
      // Attempt to reconnect after a short delay
      setTimeout(() => {
        checkConnectionWithSession(session);
      }, 2000);
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Erro ao fechar sessão');
    }
  }, [session]);

  const handleForceLogout = useCallback(async () => {
    try {
      await wppAPI.forceLogout();
      setIsAuthenticated(false);
      setSession('');
      setCurrentUser(undefined);
      setChats([]);
      setContacts([]);
      setUIState({
        selectedChat: undefined,
        messages: [],
        isLoading: false,
        isRecording: false,
        recordingTime: 0,
        showEmojiPicker: false,
        messageInput: '',
        searchQuery: '',
        filteredChats: []
      });
      setShowSettings(false);
      toast.warn('Logout forçado realizado');
    } catch (error) {
      console.error('Error during force logout:', error);
      // Force logout should still clear local data even if it fails
      setIsAuthenticated(false);
      setSession('');
      setCurrentUser(undefined);
      setChats([]);
      setContacts([]);
      setUIState({
        selectedChat: undefined,
        messages: [],
        isLoading: false,
        isRecording: false,
        recordingTime: 0,
        showEmojiPicker: false,
        messageInput: '',
        searchQuery: '',
        filteredChats: []
      });
      setShowSettings(false);
      toast.warn('Logout forçado realizado com limpeza local');
    }
  }, []);
  const handleDisconnectAndShowQR = useCallback(async () => {
    try {
      setUIState(prev => ({ ...prev, isLoading: true }));
      
      // Disconnect session and prepare for QR reconnection
      await wppAPI.disconnectAndShowQR();
      
      // Clear current session state but keep session name and token
      setIsAuthenticated(false);
      setCurrentUser(undefined);
      setChats([]);
      setContacts([]);
      setQrCode('');
      setUIState({
        selectedChat: undefined,
        messages: [],
        isLoading: false,
        isRecording: false,
        recordingTime: 0,
        showEmojiPicker: false,
        messageInput: '',
        searchQuery: '',
        filteredChats: []
      });
      setShowSettings(false);
      
      // Reset session status
      setSessionStatus({
        status: 'CLOSED'
      });
      
      toast.info('Desconectado! Escaneie o QR code novamente para reconectar');
      
      // Restart session to show QR code
      setTimeout(() => {
        startSessionWithSession(session);
      }, 1000);
      
    } catch (error) {
      console.error('Error during disconnect and QR:', error);
      toast.error('Erro ao desconectar. Tente novamente.');
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
    }
  }, [session, startSessionWithSession]);


  const handleUpdateProfile = useCallback(async (profileData: any) => {
    try {
      if (profileData.name && profileData.name !== currentUser?.name) {
        await wppAPI.updateMyProfile({ name: profileData.name });
        toast.success('Nome atualizado com sucesso');
      }

      if (profileData.about) {
        await wppAPI.setProfileStatus(profileData.about);
        toast.success('Status atualizado com sucesso');
      }

      // Update local user data
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          name: profileData.name || currentUser.name,
          pushname: profileData.name || currentUser.pushname
        });
      }
      
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  }, [currentUser]);

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GlobalStyle theme={darkTheme} />
        <Container>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px'
          }}>
            <h1 style={{ marginBottom: '24px', color: darkTheme.colors.text }}>
              WhatsApp Web
            </h1>
            
            {(sessionStatus.status === 'AUTHENTICATING' || sessionStatus.status === 'INITIALIZING' || sessionStatus.status === 'CLOSED') && qrCode && (
              <>
                <p style={{ marginBottom: '24px', color: darkTheme.colors.textSecondary }}>
                  Aponte a câmera do seu celular para este código:
                </p>
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  style={{ 
                    maxWidth: '280px', 
                    marginBottom: '24px',
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '8px'
                  }} 
                />
                <p style={{ color: darkTheme.colors.textSecondary }}>
                  Aguardando conexão...
                </p>
              </>
            )}
            
            {uiState.isLoading && (
              <p style={{ color: darkTheme.colors.textSecondary }}>
                Inicializando...
              </p>
            )}
          </div>
        </Container>
        <ToastContainer
          position="bottom-center"
          theme="dark"
          autoClose={3000}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle theme={darkTheme} />
      <Container>
        <ChatList
          chats={chats}
          contacts={contacts}
          selectedChat={uiState.selectedChat}
          onChatSelect={handleChatSelect}
          searchQuery={uiState.searchQuery}
          onSearchChange={handleSearchChange}
          currentUser={currentUser}
          onOpenSettings={handleOpenSettings}
        />
        
        <ChatArea
          chat={uiState.selectedChat}
          messages={uiState.messages}
          currentUser={currentUser}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onSendVoice={handleSendVoice}
          onLoadMore={handleLoadMore}
          isLoading={uiState.isLoading}
          hasMore={true}
        />
      </Container>
      
      <UserSettings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        onCloseSession={handleCloseSession}
        onForceLogout={handleForceLogout}
        onDisconnectAndShowQR={handleDisconnectAndShowQR}
      />
      
      <ToastContainer
        position="bottom-center"
        theme="dark"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
};

export default App;
