import React, { useMemo } from 'react';
import { Search, MoreVertical, MessageCircle, Settings } from 'lucide-react';
import {
  Sidebar,
  Header,
  IconButton,
  SearchContainer,
  SearchInput,
  SearchWrapper,
  ChatList as StyledChatList,
  ChatListItem,
  ChatInfo,
  ChatName,
  ChatLastMessage,
  ChatMeta,
  ChatTime,
  UnreadBadge
} from '../styles/GlobalStyle';
import Avatar from './Avatar';
import { Chat, Contact } from '../types';

interface ChatListProps {
  chats: Chat[];
  contacts: Contact[];
  selectedChat?: Chat;
  onChatSelect: (chat: Chat) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser?: Contact;
  onOpenSettings?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  contacts,
  selectedChat,
  onChatSelect,
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenSettings
}) => {

  // Filter and search logic
  const processedChats = useMemo(() => {
    let result = [...chats];

    // Filter out archived chats for main list
    result = result.filter(chat => !chat.archived);

    // Sort by timestamp (most recent first)
    result.sort((a, b) => b.timestamp - a.timestamp);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // First, filter existing chats
      const filteredChats = result.filter(chat => {
        const chatId = getChatId(chat);
        const name = chat.name || chatId;
        const lastMessage = chat.lastMessage?.body || '';
        return name.toLowerCase().includes(query) ||
               lastMessage.toLowerCase().includes(query) ||
               chatId.includes(query);
      });

      // Then, search contacts that aren't in chats
      const contactsNotInChats = contacts.filter(contact => {
        const isInChats = result.some(chat => getChatId(chat) === contact.id._serialized);
        const contactName = getContactDisplayName(contact);
        const matchesQuery = contactName.toLowerCase().includes(query) ||
                           contact.id._serialized.includes(query);
        return !isInChats && matchesQuery && contact.isMyContact;
      });

      // Convert contacts to chat objects
      const contactChats: Chat[] = contactsNotInChats.map(contact => ({
        id: contact.id._serialized,
        name: getContactDisplayName(contact),
        isGroup: false,
        isReadOnly: false,
        unreadCount: 0,
        timestamp: 0,
        archived: false,
        pinned: false,
        isMuted: false,
        muteExpiration: 0,
        contact,
        msgs: [],
        lastMessage: undefined
      }));

      return [...filteredChats, ...contactChats];
    }

    return result;
  }, [chats, contacts, searchQuery]);

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp * 1000);
    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: diffDays > 365 ? '2-digit' : undefined
      });
    }
  };

  const getLastMessageText = (chat: Chat): string => {
    const lastMsg = chat.lastMessage || (chat.msgs && chat.msgs[chat.msgs.length - 1]);
    
    if (!lastMsg) {
      return searchQuery.trim() ? 'Iniciar conversa' : 'Não há mensagens';
    }

    // Handle different message types
    switch (lastMsg.type) {
      case 'image':
        return '📷 Foto';
      case 'video':
        return '🎥 Vídeo';
      case 'audio':
      case 'ptt':
        return '🎵 Áudio';
      case 'document':
        return '📄 Documento';
      case 'sticker':
        return '🎭 Figurinha';
      case 'location':
        return '📍 Localização';
      case 'revoked':
        return 'Mensagem apagada';
      case 'gp2':
        return '';
      case 'notification_template':
        return '';
      default:
        return lastMsg.body || 'Mensagem de mídia';
    }
  };

  const handleChatClick = (chat: Chat) => {
    // Ensure the chat object has a proper string ID before passing it up
    const normalizedChat = {
      ...chat,
      id: getChatId(chat)
    };
    onChatSelect(normalizedChat);
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

  // Helper function to get the best display name for a contact
  const getContactDisplayName = (contact: Contact): string => {
    // Priority order: formattedName > name > pushname > shortName > phone number
    return contact.formattedName ||
           contact.name ||
           contact.pushname ||
           contact.shortName ||
           contact.id._serialized.replace(/[@c.us,@g.us]/g, '');
  };

  // Helper function to get chat display name with contact info
  const getChatDisplayName = (chat: Chat): string => {
    if (chat.name) return chat.name;
    
    // If no chat name, try to get contact info
    if (chat.contact) {
      return getContactDisplayName(chat.contact);
    }
    
    // Try to find the contact in our contacts list
    const chatId = getChatId(chat);
    const matchingContact = contacts.find(contact => contact.id._serialized === chatId);
    if (matchingContact) {
      return getContactDisplayName(matchingContact);
    }
    
    // Fallback to formatted chat ID
    return formatChatIdForDisplay(chat);
  };

  return (
    <Sidebar>
      <Header>
        {currentUser && (
          <Avatar
            contact={currentUser}
            size={40}
            alt={currentUser.name || 'User'}
            onClick={onOpenSettings}
            style={{ cursor: 'pointer' }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: '16px' }}>
            WhatsApp
          </div>
        </div>
        <IconButton>
          <MessageCircle size={20} />
        </IconButton>
        <IconButton onClick={onOpenSettings}>
          <Settings size={20} />
        </IconButton>
        <IconButton>
          <MoreVertical size={20} />
        </IconButton>
      </Header>

      <SearchContainer>
        <SearchWrapper>
          <Search />
          <SearchInput
            type="text"
            placeholder="Pesquisar ou começar uma nova conversa"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </SearchWrapper>
      </SearchContainer>

      <StyledChatList>
        {processedChats.length === 0 ? (
          <div style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            {searchQuery.trim() ? 'Nenhuma conversa encontrada' :
             chats.length === 0 ? 'Carregando conversas...' : 'Nenhuma conversa ainda'}
          </div>
        ) : (
          processedChats.map((chat) => (
            <ChatListItem
              key={getChatId(chat)}
              $active={selectedChat && getChatId(selectedChat) === getChatId(chat)}
              onClick={() => handleChatClick(chat)}
            >
              <Avatar
                contact={chat.contact}
                contactId={getChatId(chat)}
                size={50}
                alt={chat.name || getChatId(chat)}
              />
              
              <ChatInfo>
                <ChatName>
                  {getChatDisplayName(chat)}
                </ChatName>
                <ChatLastMessage>
                  {getLastMessageText(chat)}
                </ChatLastMessage>
              </ChatInfo>

              <ChatMeta>
                <ChatTime>
                  {formatTime(chat.timestamp)}
                </ChatTime>
                {chat.unreadCount > 0 && (
                  <UnreadBadge>
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </UnreadBadge>
                )}
              </ChatMeta>
            </ChatListItem>
          ))
        )}
      </StyledChatList>
    </Sidebar>
  );
};

export default ChatList;