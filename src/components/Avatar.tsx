import React, { useState } from 'react';
import styled from 'styled-components';
import { useProfileImage } from '../hooks/useProfileImage';
import { Contact } from '../types';

interface AvatarProps {
  contact?: Contact;
  contactId?: string;
  size?: number;
  alt?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const AvatarContainer = styled.div<{ $size: number; $clickable: boolean }>`
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  flex-shrink: 0;
`;

const AvatarImage = styled.img<{ $size: number }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const LoadingSpinner = styled.div<{ $size: number }>`
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.border}40;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => Math.max(props.$size * 0.3, 12)}px;
  
  &::before {
    content: '⚡';
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

const Avatar: React.FC<AvatarProps> = ({
  contact,
  contactId,
  size = 40,
  alt,
  onClick,
  className,
  style
}) => {
  const [imageError, setImageError] = useState(false);
  const id = contactId || contact?.id?._serialized || '';
  const { imageUrl, isLoading, getDefaultAvatar } = useProfileImage(id, contact);
  
  const displayName = alt || 
    contact?.name || 
    contact?.pushname || 
    contact?.formattedName || 
    id.replace(/[@c.us,@g.us]/g, '') || 
    'Contato';

  const handleImageError = () => {
    setImageError(true);
  };

  const getFallbackImage = () => {
    return getDefaultAvatar(displayName);
  };

  if (isLoading) {
    return (
      <AvatarContainer 
        $size={size} 
        $clickable={!!onClick}
        onClick={onClick}
        className={className}
        style={style}
      >
        <LoadingSpinner $size={size} />
      </AvatarContainer>
    );
  }

  const finalImageUrl = (imageError || !imageUrl) ? getFallbackImage() : imageUrl;

  return (
    <AvatarContainer 
      $size={size} 
      $clickable={!!onClick}
      onClick={onClick}
      className={className}
      style={style}
    >
      <AvatarImage
        $size={size}
        src={finalImageUrl}
        alt={displayName}
        onError={handleImageError}
        loading="lazy"
      />
    </AvatarContainer>
  );
};

export default Avatar;