import styled, { createGlobalStyle } from 'styled-components';
import { Theme } from '../types';

export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }

  body {
    overflow: hidden;
  }

  button {
    border: none;
    outline: none;
    cursor: pointer;
    background: transparent;
    font-family: inherit;
  }

  input, textarea {
    border: none;
    outline: none;
    font-family: inherit;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ul, ol {
    list-style: none;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.textSecondary}40;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.textSecondary}60;
  }

  .emoji-mart {
    background-color: ${props => props.theme.colors.surface} !important;
    border: 1px solid ${props => props.theme.colors.border} !important;
    color: ${props => props.theme.colors.text} !important;
  }

  .emoji-mart-bar {
    border-color: ${props => props.theme.colors.border} !important;
  }

  .emoji-mart-search input {
    background-color: ${props => props.theme.colors.background} !important;
    border-color: ${props => props.theme.colors.border} !important;
    color: ${props => props.theme.colors.text} !important;
  }

  .emoji-mart-category-label span {
    background-color: ${props => props.theme.colors.surface} !important;
    color: ${props => props.theme.colors.textSecondary} !important;
  }
`;

// Common styled components
export const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: ${props => props.theme.colors.background};
`;

export const Sidebar = styled.div`
  width: 30%;
  min-width: 320px;
  max-width: 500px;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
  }
`;

export const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.background};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

export const Header = styled.div`
  height: 60px;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
`;

export const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.textSecondary};
  object-fit: cover;
`;

export const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.border};
  }

  &:active {
    background-color: ${props => props.theme.colors.textSecondary}40;
  }
`;

export const SearchContainer = styled.div`
  padding: 12px;
  background-color: ${props => props.theme.colors.surface};
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 35px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 0 16px 0 48px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.textSecondary};
    width: 16px;
    height: 16px;
  }
`;

export const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.surface};
`;

export const ChatListItem = styled.div<{ $active?: boolean; $unread?: boolean }>`
  height: 72px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background-color: ${props => props.$active ? props.theme.colors.border : 'transparent'};
  border-bottom: 1px solid ${props => props.theme.colors.border}20;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.border}40;
  }
`;

export const ChatInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

export const ChatName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChatLastMessage = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChatMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 50px;
`;

export const ChatTime = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
`;

export const UnreadBadge = styled.div`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
`;

export const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 60px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cg%3e%3cpath d='M0,100 Q25,75 50,100 T100,100 V0 Q75,25 50,0 T0,0 Z' fill='%23${props => props.theme.colors.background.replace('#', '')}'/%3e%3c/g%3e%3c/svg%3e");
    background-size: 100px 100px;
    background-repeat: repeat;
    opacity: 0.02;
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

export const MessageGroup = styled.div<{ $isOwn: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
  width: 100%;
`;

export const MessageBubble = styled.div<{ $isOwn: boolean }>`
  max-width: 470px;
  min-width: 80px;
  background-color: ${props => props.$isOwn ? props.theme.colors.messageOwn : props.theme.colors.messageOther};
  border-radius: ${props => props.$isOwn ? '7.5px 7.5px 0 7.5px' : '7.5px 7.5px 7.5px 0'};
  padding: 6px 7px 8px 9px;
  position: relative;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  white-space: pre-wrap;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
  margin: ${props => props.$isOwn ? '0 5px 0 50px' : '0 50px 0 5px'};
  
  &::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    ${props => props.$isOwn ? `
      right: -8px;
      bottom: 0;
      border-left: 8px solid ${props.theme.colors.messageOwn};
      border-bottom: 8px solid transparent;
    ` : `
      left: -8px;
      bottom: 0;
      border-right: 8px solid ${props.theme.colors.messageOther};
      border-bottom: 8px solid transparent;
    `}
  }
`;

export const MessageText = styled.div`
  font-size: 14.2px;
  line-height: 19px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 2px;
  font-weight: 400;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
`;

export const MessageTime = styled.div`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  opacity: 0.7;
  margin-top: 2px;
  line-height: 15px;
`;

export const MessageInput = styled.div`
  padding: 12px 16px;
  background-color: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const InputField = styled.input`
  flex: 1;
  height: 40px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 20px;
  padding: 0 16px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

export const SendButton = styled.button<{ $disabled?: boolean }>`
  width: 40px;
  height: 40px;
  background-color: ${props => props.$disabled ? props.theme.colors.textSecondary : props.theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.secondary};
  }
`;