import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import {
  X,
  User,
  Heart,
  Briefcase,
  MessageSquare,
  Lock,
  Shield,
  MessageCircle,
  Bell,
  HardDrive,
  HelpCircle,
  Settings,
  LogOut,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Power,
  Trash2,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Contact } from '../types';
import Avatar from './Avatar';
import { useProfileImageUpload } from '../hooks/useProfileImageUpload';
import { clearUserProfileImageCache, notifyProfileImageUpdate } from '../hooks/useProfileImage';

const SettingsOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const SettingsContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
  display: flex;
  transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;
`;

const SettingsSidebar = styled.div`
  width: 30%;
  min-width: 320px;
  max-width: 500px;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
`;

const SettingsHeader = styled.div`
  height: 60px;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
`;

const CloseButton = styled.button`
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
`;

const SettingsTitle = styled.h1`
  font-size: 20px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const UserProfileSection = styled.div`
  padding: 20px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const UserProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.border}40;
  }
`;


const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const UserStatus = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

const MenuList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const MenuItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  cursor: pointer;
  background-color: ${props => props.$active ? props.theme.colors.border : 'transparent'};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.border}40;
  }
`;

const MenuIcon = styled.div`
  width: 24px;
  height: 24px;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuText = styled.div`
  flex: 1;
  font-size: 16px;
  color: ${props => props.theme.colors.text};
`;

const SettingsContent = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
  display: flex;
  flex-direction: column;
`;

const ContentHeader = styled.div`
  height: 60px;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 24px;
`;

const ContentTitle = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const ContentBody = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

// Profile Edit Components
const ProfileSection = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

const ProfileImageSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`;

const ProfileImageContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const ProfileImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const ProfileImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  border-radius: 50%;

  ${ProfileImage}:hover & {
    opacity: 1;
  }
`;

const EditImageButton = styled.button`
  background-color: transparent;
  border: none;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const ProfileImageText = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 0 16px;
  color: ${props => props.theme.colors.text};
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background-color: ${props.theme.colors.primary};
    color: white;
    
    &:hover {
      background-color: ${props.theme.colors.secondary};
    }
  ` : props.$variant === 'danger' ? `
    background-color: ${props.theme.colors.danger};
    color: white;
    
    &:hover {
      background-color: ${props.theme.colors.danger}dd;
    }
  ` : `
    background-color: transparent;
    color: ${props.theme.colors.text};
    border: 1px solid ${props.theme.colors.border};
    
    &:hover {
      background-color: ${props.theme.colors.border}40;
    }
  `}
`;

const LogoutSection = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  margin-top: auto;
`;

// Profile Image Upload Components
const HiddenFileInput = styled.input`
  display: none;
`;

const ProfileImageUploadModal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const UploadModalContent = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const ModalCloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.border};
  }
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const PreviewImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
  border: 3px solid ${props => props.theme.colors.border};
`;

const UploadButton = styled.button`
  padding: 12px 24px;
  background-color: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  border: 2px dashed ${props => props.theme.colors.textSecondary};
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.primary}10;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: ${props => props.theme.colors.danger}10;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SuccessMessage = styled.div`
  color: ${props => props.theme.colors.success};
  background-color: ${props => props.theme.colors.success}10;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Session Management Components
const SessionManagementSection = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
`;

const OptionCard = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary}40;
    background-color: ${props => props.theme.colors.primary}05;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const OptionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const OptionIcon = styled.div<{ $variant?: 'primary' | 'danger' }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props =>
    props.$variant === 'danger'
      ? props.theme.colors.danger + '15'
      : props.theme.colors.primary + '15'
  };
  color: ${props =>
    props.$variant === 'danger'
      ? props.theme.colors.danger
      : props.theme.colors.primary
  };
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const OptionDescription = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.4;
`;

// Confirmation Modal Components
const ConfirmationModal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const ConfirmationContent = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
`;

const ConfirmationIcon = styled.div<{ $variant?: 'danger' | 'warning' }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  background-color: ${props =>
    props.$variant === 'danger'
      ? props.theme.colors.danger + '15'
      : props.theme.colors.warning + '15'
  };
  color: ${props =>
    props.$variant === 'danger'
      ? props.theme.colors.danger
      : props.theme.colors.warning
  };
`;

const ConfirmationTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  text-align: center;
  margin-bottom: 12px;
`;

const ConfirmationMessage = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  line-height: 1.5;
  margin-bottom: 24px;
`;

const ConfirmationActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: Contact;
  onLogout: () => void;
  onUpdateProfile?: (data: any) => void;
  onCloseSession?: () => Promise<void>;
  onForceLogout?: () => Promise<void>;
  onDisconnectAndShowQR?: () => Promise<void>;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onUpdateProfile,
  onCloseSession,
  onForceLogout,
  onDisconnectAndShowQR
}) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || currentUser?.pushname || '',
    phone: '',
    about: '',
    links: ''
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<{
    isOpen: boolean;
    type: 'close' | 'logout' | 'force-logout' | 'disconnect-qr' | null;
    title: string;
    message: string;
    variant: 'danger' | 'warning';
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    variant: 'warning'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isUploading,
    uploadError,
    previewUrl,
    selectedFile,
    selectFile,
    uploadProfileImage,
    clearSelection,
    clearError
  } = useProfileImageUpload();

  const menuItems = [
    { id: 'profile', icon: User, label: 'Perfil', active: true },
    { id: 'session', icon: Power, label: 'Gerenciar Sessão' },
    { id: 'favorites', icon: Heart, label: 'Favoritos' },
    { id: 'business', icon: Briefcase, label: 'Business tools' },
    { id: 'history', icon: MessageSquare, label: 'Histórico de conversas' },
    { id: 'account', icon: Lock, label: 'Conta' },
    { id: 'privacy', icon: Shield, label: 'Privacidade' },
    { id: 'chats', icon: MessageCircle, label: 'Conversas' },
    { id: 'notifications', icon: Bell, label: 'Notificações' },
    { id: 'storage', icon: HardDrive, label: 'Armazenamento e dados' },
    { id: 'help', icon: HelpCircle, label: 'Ajuda' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file selection from input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
      setUploadSuccess(false);
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Handle profile image edit click
  const handleEditProfileImage = () => {
    setShowUploadModal(true);
    clearError();
    setUploadSuccess(false);
  };

  // Close upload modal
  const closeUploadModal = () => {
    setShowUploadModal(false);
    clearSelection();
    setUploadSuccess(false);
  };

  // Handle upload
  const handleUpload = async () => {
    const success = await uploadProfileImage();
    if (success) {
      setUploadSuccess(true);
      // Clear the current user's profile image cache and notify all listeners
      const userId = currentUser?.id?._serialized || '';
      clearUserProfileImageCache(userId);
      notifyProfileImageUpdate(userId);
      // Close modal after a short delay to show success
      setTimeout(() => {
        closeUploadModal();
      }, 1500);
    }
  };

  // Session termination handlers
  const handleSessionAction = (type: 'close' | 'logout' | 'force-logout' | 'disconnect-qr') => {
    const confirmations = {
      'close': {
        title: 'Fechar Sessão',
        message: 'Isso fechará sua sessão atual, mas manterá seus dados salvos. Você poderá reconectar facilmente.',
        variant: 'warning' as const
      },
      'logout': {
        title: 'Desconectar Completamente',
        message: 'Isso desconectará sua conta do WhatsApp e removerá todos os dados locais. Você precisará escanear o QR code novamente.',
        variant: 'danger' as const
      },
      'force-logout': {
        title: 'Forçar Desconexão',
        message: 'Use apenas se estiver com problemas de conexão. Isso removerá todos os dados locais imediatamente.',
        variant: 'danger' as const
      },
      'disconnect-qr': {
        title: 'Desconectar e Mostrar QR',
        message: 'Isso desconectará sua sessão atual e exibirá o QR code novamente para uma nova conexão.',
        variant: 'warning' as const
      }
    };

    setShowConfirmation({
      isOpen: true,
      type,
      ...confirmations[type]
    });
  };

  const handleConfirmAction = async () => {
    if (!showConfirmation.type) return;

    setIsProcessing(true);
    try {
      switch (showConfirmation.type) {
        case 'close':
          if (onCloseSession) {
            await onCloseSession();
          }
          break;
        case 'logout':
          await onLogout();
          break;
        case 'force-logout':
          if (onForceLogout) {
            await onForceLogout();
          }
          break;
        case 'disconnect-qr':
          if (onDisconnectAndShowQR) {
            await onDisconnectAndShowQR();
          }
          break;
      }
      
      setShowConfirmation({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        variant: 'warning'
      });
      
      // Close settings after successful action
      onClose();
      
    } catch (error) {
      console.error('Error during session action:', error);
      // Keep confirmation open to show error or retry
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmation({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      variant: 'warning'
    });
  };

  // Render confirmation modal
  const renderConfirmationModal = () => (
    <ConfirmationModal $isOpen={showConfirmation.isOpen}>
      <ConfirmationContent>
        <ConfirmationIcon $variant={showConfirmation.variant}>
          {showConfirmation.variant === 'danger' ?
            <AlertTriangle size={32} /> :
            <AlertCircle size={32} />
          }
        </ConfirmationIcon>
        
        <ConfirmationTitle>{showConfirmation.title}</ConfirmationTitle>
        <ConfirmationMessage>{showConfirmation.message}</ConfirmationMessage>
        
        <ConfirmationActions>
          <ActionButton onClick={handleCancelAction} disabled={isProcessing}>
            Cancelar
          </ActionButton>
          <ActionButton
            $variant="danger"
            onClick={handleConfirmAction}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Confirmar'}
          </ActionButton>
        </ConfirmationActions>
      </ConfirmationContent>
    </ConfirmationModal>
  );

  // Render upload modal
  const renderUploadModal = () => (
    <ProfileImageUploadModal $isOpen={showUploadModal}>
      <UploadModalContent>
        <ModalHeader>
          <ModalTitle>Alterar foto do perfil</ModalTitle>
          <ModalCloseButton onClick={closeUploadModal}>
            <X size={20} />
          </ModalCloseButton>
        </ModalHeader>

        <PreviewSection>
          {previewUrl ? (
            <PreviewImage src={previewUrl} alt="Preview" />
          ) : (
            <Avatar
              contact={currentUser}
              size={200}
              alt={currentUser?.name || currentUser?.pushname || 'User'}
            />
          )}

          <UploadButton onClick={openFileDialog} disabled={isUploading}>
            <Upload size={20} />
            {selectedFile ? 'Escolher outra imagem' : 'Escolher imagem'}
          </UploadButton>

          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </PreviewSection>

        {uploadError && (
          <ErrorMessage>
            <AlertCircle size={16} />
            {uploadError}
          </ErrorMessage>
        )}

        {uploadSuccess && (
          <SuccessMessage>
            <Check size={16} />
            Foto do perfil atualizada com sucesso!
          </SuccessMessage>
        )}

        {isUploading && (
          <LoadingSpinner>
            <Loader2 size={16} className="animate-spin" />
            Enviando imagem...
          </LoadingSpinner>
        )}

        <ModalActions>
          <ActionButton onClick={closeUploadModal} disabled={isUploading}>
            Cancelar
          </ActionButton>
          <ActionButton
            $variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadSuccess}
          >
            {isUploading ? 'Enviando...' : 'Salvar'}
          </ActionButton>
        </ModalActions>
      </UploadModalContent>
    </ProfileImageUploadModal>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <ContentBody>
            <ProfileSection>
              <ProfileImageSection>
                <ProfileImageContainer>
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      contact={currentUser}
                      size={120}
                      alt={currentUser?.name || currentUser?.pushname || 'User'}
                    />
                    <ProfileImageOverlay onClick={handleEditProfileImage}>
                      <EditImageButton>
                        <Camera size={20} />
                        Edit
                      </EditImageButton>
                    </ProfileImageOverlay>
                  </div>
                </ProfileImageContainer>
                <ProfileImageText>
                  Enter your name and add an optional profile picture
                </ProfileImageText>
              </ProfileImageSection>

              <FormGroup>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Digite seu nome"
                />
              </FormGroup>
            </ProfileSection>

            <ProfileSection>
              <FormGroup>
                <Label htmlFor="phone">Número de telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+55 19 99924-3851"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="about">Sobre</Label>
                <TextArea
                  id="about"
                  value={profileData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  placeholder="Acesse: izirh.io"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="links">Links</Label>
                <Input
                  id="links"
                  type="url"
                  value={profileData.links}
                  onChange={(e) => handleInputChange('links', e.target.value)}
                  placeholder="Add links"
                />
              </FormGroup>
            </ProfileSection>

            <LogoutSection>
              <ActionButton $variant="danger" onClick={onLogout}>
                <LogOut size={20} style={{ marginRight: 8 }} />
                Log out
              </ActionButton>
            </LogoutSection>
          </ContentBody>
        );

      case 'session':
        return (
          <ContentBody>
            <SessionManagementSection>
              <SectionTitle>Opções de Sessão</SectionTitle>
              
              <OptionCard onClick={() => handleSessionAction('disconnect-qr')}>
                <OptionHeader>
                  <OptionIcon>
                    <QrCode size={20} />
                  </OptionIcon>
                  <OptionContent>
                    <OptionTitle>Desconectar e Mostrar QR</OptionTitle>
                    <OptionDescription>
                      Desconecta a sessão atual e exibe o QR code novamente para reconexão rápida.
                    </OptionDescription>
                  </OptionContent>
                </OptionHeader>
              </OptionCard>

              <OptionCard onClick={() => handleSessionAction('close')}>
                <OptionHeader>
                  <OptionIcon>
                    <Power size={20} />
                  </OptionIcon>
                  <OptionContent>
                    <OptionTitle>Fechar Sessão</OptionTitle>
                    <OptionDescription>
                      Fecha a sessão atual mantendo os dados salvos. Você pode reconectar facilmente depois.
                    </OptionDescription>
                  </OptionContent>
                </OptionHeader>
              </OptionCard>

              <OptionCard onClick={() => handleSessionAction('logout')}>
                <OptionHeader>
                  <OptionIcon $variant="danger">
                    <LogOut size={20} />
                  </OptionIcon>
                  <OptionContent>
                    <OptionTitle>Desconectar Completamente</OptionTitle>
                    <OptionDescription>
                      Remove todos os dados locais e desconecta do WhatsApp. Será necessário escanear o QR code novamente.
                    </OptionDescription>
                  </OptionContent>
                </OptionHeader>
              </OptionCard>

              <OptionCard onClick={() => handleSessionAction('force-logout')}>
                <OptionHeader>
                  <OptionIcon $variant="danger">
                    <Trash2 size={20} />
                  </OptionIcon>
                  <OptionContent>
                    <OptionTitle>Forçar Desconexão</OptionTitle>
                    <OptionDescription>
                      Use apenas se estiver com problemas de conexão. Remove todos os dados imediatamente.
                    </OptionDescription>
                  </OptionContent>
                </OptionHeader>
              </OptionCard>
            </SessionManagementSection>
          </ContentBody>
        );
      
      default:
        return (
          <ContentBody>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              flexDirection: 'column',
              gap: '16px',
              color: 'var(--text-secondary)'
            }}>
              <Settings size={48} />
              <p>Esta seção está em desenvolvimento</p>
            </div>
          </ContentBody>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <SettingsOverlay $isOpen={isOpen} onClick={onClose}>
        <SettingsContainer $isOpen={isOpen} onClick={(e) => e.stopPropagation()}>
          <SettingsSidebar>
            <SettingsHeader>
              <CloseButton onClick={onClose}>
                <X size={24} />
              </CloseButton>
              <SettingsTitle>Settings</SettingsTitle>
            </SettingsHeader>

            <UserProfileSection>
              <UserProfileCard onClick={() => setActiveSection('profile')}>
                <div style={{ marginRight: '12px' }}>
                  <Avatar
                    contact={currentUser}
                    size={60}
                    alt={currentUser?.name || currentUser?.pushname || 'User'}
                  />
                </div>
                <UserInfo>
                  <UserName>{currentUser?.name || currentUser?.pushname || 'Usuário'}</UserName>
                  <UserStatus>Acesse: izirh.io</UserStatus>
                </UserInfo>
              </UserProfileCard>
            </UserProfileSection>

            <MenuList>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  $active={activeSection === item.id}
                  onClick={() => setActiveSection(item.id)}
                >
                  <MenuIcon>
                    <item.icon size={20} />
                  </MenuIcon>
                  <MenuText>{item.label}</MenuText>
                </MenuItem>
              ))}
            </MenuList>
          </SettingsSidebar>

          <SettingsContent>
            <ContentHeader>
              <ContentTitle>
                {activeSection === 'profile' ? 'Edit profile' :
                 menuItems.find(item => item.id === activeSection)?.label || 'Settings'}
              </ContentTitle>
            </ContentHeader>
            {renderContent()}
          </SettingsContent>
        </SettingsContainer>
      </SettingsOverlay>

      {renderUploadModal()}
      {renderConfirmationModal()}
    </>
  );
};

export default UserSettings;