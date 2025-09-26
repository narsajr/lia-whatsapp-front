import { useState, useEffect } from 'react';
import wppAPI from '../services/api';
import { Contact } from '../types';

interface ProfileImageCache {
  [contactId: string]: {
    url: string;
    timestamp: number;
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let profileImageCache: ProfileImageCache = {};

// Event system for profile image updates
const profileImageUpdateListeners: Set<(contactId: string) => void> = new Set();

export const addProfileImageUpdateListener = (listener: (contactId: string) => void) => {
  profileImageUpdateListeners.add(listener);
  return () => {
    profileImageUpdateListeners.delete(listener);
  };
};

export const notifyProfileImageUpdate = (contactId: string) => {
  profileImageUpdateListeners.forEach(listener => listener(contactId));
};

export const useProfileImage = (contactId?: string, contact?: Contact) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [forceRefresh, setForceRefresh] = useState(0);

  const getDefaultAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00a884&color=fff&size=160`;
  };

  const getCachedImage = (id: string) => {
    const cached = profileImageCache[id];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url;
    }
    return null;
  };

  const setCachedImage = (id: string, url: string) => {
    profileImageCache[id] = {
      url,
      timestamp: Date.now()
    };
  };

  useEffect(() => {
    // For current user, try to get their own profile picture
    const isCurrentUser = contact?.isMe;
    if(isCurrentUser){
      console.log("iscurrentuser",contact)
    }
    const cleanId = contactId ? contactId.replace(/[@c.us,@g.us]/g, '') : '';
    const displayName = contact?.name || contact?.pushname || contact?.formattedName || cleanId || 'User';

    // If no contactId and not current user, just show default avatar
    if (!contactId && !isCurrentUser) {
      const defaultUrl = getDefaultAvatar(displayName);
      setImageUrl(defaultUrl);
      return;
    }

    // If contactId is empty string or invalid, show default avatar
    if (contactId === '' || (cleanId === '' && !isCurrentUser)) {
      const defaultUrl = getDefaultAvatar(displayName);
      setImageUrl(defaultUrl);
      return;
    }

    // Check if we have a cached image first
    const cacheKey = cleanId;
    const cachedUrl = getCachedImage(cacheKey);
    if (cachedUrl) {
      setImageUrl(cachedUrl);
      return;
    }

    // Check if contact already has profile pic info
    if (contact?.profilePicThumbObj?.img) {
      const profileUrl = contact.profilePicThumbObj.img;
      setImageUrl(profileUrl);
      setCachedImage(cacheKey, profileUrl);
      return;
    }

    if (contact?.profilePicThumbObj?.imgFull) {
      const profileUrl = contact.profilePicThumbObj.imgFull;
      setImageUrl(profileUrl);
      setCachedImage(cacheKey, profileUrl);
      return;
    }

    // If no cached or contact profile pic, fetch from API
    const fetchProfilePic = async () => {
      setIsLoading(true);
      setError('');

      try {
        // For current user, don't pass contactId to get own profile pic
        // For other users, ensure we have a valid clean ID (phone number only)
        /*if (isCurrentUser) {
          const response = await wppAPI.getProfilePicUrl(undefined);
          
          if (response.status === 'success' && response.response?.profilePic) {
            const profileUrl = response.response.profilePic;
            setImageUrl(profileUrl);
            setCachedImage(cacheKey, profileUrl);
          } else {
            // Fallback to default avatar
            const defaultUrl = getDefaultAvatar(displayName);
            setImageUrl(defaultUrl);
            setCachedImage(cacheKey, defaultUrl);
          }
        } else */if (cleanId && cleanId.length > 0 && /^\d+$/.test(cleanId)) {
          // Only call API if we have a valid phone number (only digits)
          const response = await wppAPI.getProfilePicUrl(cleanId);
          
          if (response.status === 'success' && response.response?.profilePic) {
            const profileUrl = response.response.profilePic;
            setImageUrl(profileUrl);
            setCachedImage(cacheKey, profileUrl);
          } else {
            // Fallback to default avatar
            const defaultUrl = getDefaultAvatar(displayName);
            setImageUrl(defaultUrl);
            setCachedImage(cacheKey, defaultUrl);
          }
        } else {
          // Invalid ID format, just use default avatar
          const defaultUrl = getDefaultAvatar(displayName);
          setImageUrl(defaultUrl);
          setCachedImage(cacheKey, defaultUrl);
        }
      } catch (err) {
        console.warn('Failed to fetch profile pic for', isCurrentUser ? 'current user' : cleanId, err);
        // Fallback to default avatar
        const defaultUrl = getDefaultAvatar(displayName);
        setImageUrl(defaultUrl);
        setCachedImage(cacheKey, defaultUrl);
        setError('Failed to load profile image');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilePic();
  }, [contactId, contact, forceRefresh]);

  // Listen for profile image updates
  useEffect(() => {
    const cleanId = contactId ? contactId.replace(/[@c.us,@g.us]/g, '') : '';
    const currentUserWid = contact?.isMe;
    
    const handleProfileImageUpdate = (updatedContactId: string) => {
      // If this is the current user or the updated contact matches this contact
      if (currentUserWid || updatedContactId === cleanId || updatedContactId === contactId) {
        // Clear cache and force refresh
        clearUserProfileImageCache(updatedContactId);
        setForceRefresh(prev => prev + 1);
      }
    };

    const removeListener = addProfileImageUpdateListener(handleProfileImageUpdate);
    return removeListener;
  }, [contactId, contact?.isMe]);

  return {
    imageUrl,
    isLoading,
    error,
    getDefaultAvatar
  };
};

// Export cache management functions for external use
export const clearProfileImageCache = () => {
  profileImageCache = {};
};

export const clearUserProfileImageCache = (contactId?: string) => {
  if (contactId) {
    const cleanId = contactId.replace(/[@c.us,@g.us]/g, '');
    delete profileImageCache[cleanId];
  } else {
    // Clear current user's cache (empty key for current user)
    delete profileImageCache[''];
  }
};

export const getProfileImageFromCache = (contactId: string) => {
  const cleanId = contactId.replace(/[@c.us,@g.us]/g, '');
  const cached = profileImageCache[cleanId];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }
  return null;
};

export const refreshProfileImage = (contactId?: string, contact?: Contact) => {
  // This function can be used to trigger a re-fetch of the profile image
  if (contactId) {
    clearUserProfileImageCache(contactId);
  }
};