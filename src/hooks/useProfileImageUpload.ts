import { useState, useCallback } from 'react';
import wppAPI from '../services/api';

interface ProfileImageUploadState {
  isUploading: boolean;
  uploadError: string | null;
  previewUrl: string | null;
  selectedFile: File | null;
}

export const useProfileImageUpload = () => {
  const [state, setState] = useState<ProfileImageUploadState>({
    isUploading: false,
    uploadError: null,
    previewUrl: null,
    selectedFile: null
  });

  // This function is no longer needed as we're sending the file directly
  // const fileToBase64 = (file: File): Promise<string> => { ... }

  // Validate image file
  const validateImageFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Apenas arquivos de imagem são aceitos (JPEG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return 'A imagem deve ter menos de 5MB';
    }

    return null;
  };

  // Handle file selection
  const selectFile = useCallback((file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setState(prev => ({
        ...prev,
        uploadError: validationError,
        previewUrl: null,
        selectedFile: null
      }));
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setState(prev => ({
      ...prev,
      selectedFile: file,
      previewUrl,
      uploadError: null
    }));
  }, []);

  // Upload profile image
  const uploadProfileImage = useCallback(async (): Promise<boolean> => {
    if (!state.selectedFile) {
      setState(prev => ({ ...prev, uploadError: 'Nenhum arquivo selecionado' }));
      return false;
    }

    setState(prev => ({ ...prev, isUploading: true, uploadError: null }));

    try {
      // Send the file directly to the API
      const response = await wppAPI.setProfilePic(state.selectedFile);

      if (response.status === 'success') {
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadError: null
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadError: 'Falha ao atualizar foto do perfil'
        }));
        return false;
      }
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadError: error?.message || 'Erro ao fazer upload da imagem'
      }));
      return false;
    }
  }, [state.selectedFile]);

  // Clear selection and preview
  const clearSelection = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({
      isUploading: false,
      uploadError: null,
      previewUrl: null,
      selectedFile: null
    });
  }, [state.previewUrl]);

  // Reset error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, uploadError: null }));
  }, []);

  return {
    ...state,
    selectFile,
    uploadProfileImage,
    clearSelection,
    clearError
  };
};