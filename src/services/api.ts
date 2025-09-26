import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';
import { 
  ApiResponse, 
  Chat, 
  Contact, 
  Message, 
  SendMessageRequest, 
  SendFileRequest, 
  SendVoiceRequest,
  SessionStatus 
} from '../types';

class WppConnectAPI {
  private api: AxiosInstance;
  private socket: Socket;
  private session: string = '';
  private token: string = '';
  
  constructor() {
    // Default configuration - can be overridden
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:21465/api';
    const socketURL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:21465';
    
    this.api = axios.create({
      baseURL,
      timeout: 30000, // Increased to 30 seconds for better handling of slow responses
    });
    
    this.socket = io(socketURL, {
      autoConnect: false,
    });
    
    // Add request interceptor to include auth headers
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
    
    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }
  
  // Session Management
  setSession(session: string, token: string): void {
    this.session = session;
    this.token = token;
    this.connectSocket();
  }
  
  connectSocket(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }
  
  disconnectSocket(): void {
    this.socket.disconnect();
  }
  
  // Authentication & Session
  async generateToken(session: string, secretKey: string): Promise<{ status: string; session: string; token: string; full: string }> {
    const response: AxiosResponse<{ status: string; session: string; token: string; full: string }> = await this.api.post(
      `/${session}/${secretKey}/generate-token`
    );
    return response.data;
  }
  
  async startSession(session: string, waitQrCode = false): Promise<SessionStatus> {
    const response: AxiosResponse<SessionStatus> = await this.api.post(
      `/${session}/start-session`,
      { waitQrCode }
    );
    return response.data;
  }
  
  async getSessionStatus(session: string): Promise<SessionStatus> {
    const response: AxiosResponse<SessionStatus> = await this.api.get(
      `/${session}/status-session`
    );
    return response.data;
  }
  
  async getQRCode(session: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      `/${session}/qrcode-session`,
      { responseType: 'blob' }
    );
    return response.data;
  }
  
  async checkConnection(session: string): Promise<ApiResponse<{ status: boolean }>> {
    const response: AxiosResponse<ApiResponse<{ status: boolean }>> = await this.api.get(
      `/${session}/check-connection-session`
    );
    return response.data;
  }
  
  async closeSession(session: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${session}/close-session`
    );
    return response.data;
  }
  
  async logoutSession(session: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${session}/logout-session`
    );
    return response.data;
  }
  
  // Chat Management
  async getAllChats(retryCount = 0): Promise<ApiResponse<Chat[]>> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds between retries
    
    try {
      console.log(`Fetching chats (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      // Use the newer list-chats API with pagination instead of all-chats-with-messages
      const response: AxiosResponse<any> = await this.api.post(
        `/${this.session}/list-chats`,
        {
          count: 100, // Increased to load more chats
          onlyWithUnreadMessage: false
        },
        {
          timeout: 25000 // Increased timeout for first load
        }
      );
      
      console.log('Chats loaded successfully:', response.data?.length || 0, 'chats');
      
      // The list-chats API returns data directly, not wrapped in ApiResponse
      return {
        status: 'success',
        response: response.data || []
      };
    } catch (error: any) {
      console.error(`Error fetching chats (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a connection/timing issue that might benefit from retry
      const serverError = error.response?.data;
      const isRetriableError =
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.response?.status === 500 ||
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.response?.status === 504 ||
        serverError?.code === 'CLIENT_NOT_AVAILABLE' ||
        serverError?.code === 'CLIENT_NOT_CONNECTED' ||
        serverError?.code === 'LIST_CHATS_ERROR';
      
      if (isRetriableError && retryCount < maxRetries) {
        const delay = retryDelay * (retryCount + 1); // Exponential backoff
        console.log(`Connection/timing issue detected (${serverError?.code || error.code}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getAllChats(retryCount + 1);
      }
      
      // If max retries reached or non-retriable error, return with error status
      // but don't throw to allow app to continue with empty chat list
      const errorMsg = serverError?.message || error.message || 'Failed to load chats';
      console.warn(`Failed to load chats after ${retryCount + 1} attempts:`, errorMsg);
      return {
        status: 'error',
        response: [],
        error: errorMsg
      };
    }
  }
  
  async getChatById(chatId: string | any, isGroup = false): Promise<ApiResponse<Message[]>> {
    try {
      // Ensure chatId is a string - handle object case
      let idString: string;
      if (typeof chatId === 'string') {
        idString = chatId;
      } else if (chatId && typeof chatId === 'object' && '_serialized' in chatId) {
        idString = chatId._serialized;
      } else {
        idString = String(chatId || '');
      }
      
      const cleanId = idString.replace(/[@c.us,@g.us]/g, '');
      // Use get-messages endpoint instead of chat-by-id for messages
      const response: AxiosResponse<ApiResponse<Message[]>> = await this.api.get(
        `/${this.session}/get-messages/${cleanId}`
      );
      return response.data;
    } catch (error: any) {
      // Handle chat not found errors more gracefully
      if (error.response?.status === 404) {
        console.warn(`Chat ${chatId} not found or not accessible`);
        return {
          status: 'error',
          response: [],
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  async loadEarlierMessages(chatId: string, isGroup = false): Promise<ApiResponse<Message[]>> {
    const response: AxiosResponse<ApiResponse<Message[]>> = await this.api.get(
      `/${this.session}/load-earlier-messages/${chatId}?isGroup=${isGroup}`
    );
    return response.data;
  }
  
  async getAllContacts(): Promise<ApiResponse<Contact[]>> {
    const response: AxiosResponse<ApiResponse<Contact[]>> = await this.api.get(
      `/${this.session}/all-contacts`
    );
    return response.data;
  }
  
  async sendSeen(phone: string): Promise<ApiResponse<any>> {
    const cleanPhone = phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/send-seen`,
      { phone: cleanPhone }
    );
    return response.data;
  }
  
  // Message Operations
  async sendMessage(data: SendMessageRequest): Promise<ApiResponse<Message>> {
    const cleanPhone = data.phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<Message>> = await this.api.post(
      `/${this.session}/send-message`,
      {
        phone: [cleanPhone],
        message: data.message,
        isGroup: data.isGroup,
        options: data.options,
      }
    );
    return response.data;
  }
  
  async sendReply(phone: string, message: string, messageId: string, isGroup = false): Promise<ApiResponse<Message>> {
    const cleanPhone = phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<Message>> = await this.api.post(
      `/${this.session}/send-reply`,
      {
        phone: [cleanPhone],
        message,
        messageId,
        isGroup,
      }
    );
    return response.data;
  }
  
  async sendFile(data: SendFileRequest): Promise<ApiResponse<Message>> {
    const cleanPhone = data.phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<Message>> = await this.api.post(
      `/${this.session}/send-file-base64`,
      {
        phone: [cleanPhone],
        base64: data.base64,
        filename: data.filename,
        caption: data.caption,
        isGroup: data.isGroup,
        options: data.options,
      }
    );
    return response.data;
  }
  
  async sendVoice(data: SendVoiceRequest): Promise<ApiResponse<Message>> {
    const cleanPhone = data.phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<Message>> = await this.api.post(
      `/${this.session}/send-voice-base64`,
      {
        phone: [cleanPhone],
        base64Ptt: data.base64Ptt,
        quotedMessageId: data.quotedMessageId,
      }
    );
    return response.data;
  }
  
  async getMediaByMessage(messageId: string): Promise<ApiResponse<{ base64: string; mimetype: string }>> {
    const response: AxiosResponse<ApiResponse<{ base64: string; mimetype: string }>> = await this.api.get(
      `/${this.session}/get-media-by-message/${messageId}`
    );
    return response.data;
  }

  getMediaUrl(messageId: string): string {
    const baseURL = this.api.defaults.baseURL || '';
    const url = `${baseURL}/${this.session}/media/${messageId}`;
    
    // Add authorization token as query parameter for direct media access
    if (this.token) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}authorization=${encodeURIComponent(`Bearer ${this.token}`)}`;
    }
    
    return url;
  }
  
  async deleteMessage(messageId: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/delete-message`,
      { messageId }
    );
    return response.data;
  }
  
  // Real-time Events
  onMessage(callback: (message: Message) => void): () => void {
    const handler = (data: any) => {
      callback(data.response);
    };
    
    this.socket.off('received-message', handler);
    this.socket.on('received-message', handler);
    
    return () => this.socket.off('received-message', handler);
  }
  
  onAck(callback: (ack: any) => void): () => void {
    const handler = (data: any) => {
      callback(data);
    };
    
    this.socket.off('onack', handler);
    this.socket.on('onack', handler);
    
    return () => this.socket.off('onack', handler);
  }
  
  onConnectionStatus(callback: (status: boolean) => void): () => void {
    const handler = (status: boolean) => {
      callback(status);
    };
    
    this.socket.off('whatsapp-status', handler);
    this.socket.on('whatsapp-status', handler);
    
    return () => this.socket.off('whatsapp-status', handler);
  }
  
  // Typing and Presence
  async setTyping(phone: string, isTyping: boolean): Promise<ApiResponse<any>> {
    const cleanPhone = phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/typing`,
      { phone: cleanPhone, isTyping }
    );
    return response.data;
  }
  
  async setRecording(phone: string, isRecording: boolean): Promise<ApiResponse<any>> {
    const cleanPhone = phone.replace(/[@c.us,@g.us]/g, '');
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/recording`,
      { phone: cleanPhone, isRecording }
    );
    return response.data;
  }
  
  // Profile & User Management
  async getHostDevice(session: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(
      `/${session}/host-device`
    );
    return response.data;
  }

  async getMyContacts(): Promise<ApiResponse<Contact[]>> {
    const response: AxiosResponse<ApiResponse<Contact[]>> = await this.api.get(
      `/${this.session}/my-contacts`
    );
    return response.data;
  }

  async updateMyProfile(data: {
    name?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/set-profile-name`,
      { name: data.name }
    );
    return response.data;
  }

  async setProfileStatus(status: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/set-profile-status`,
      { status }
    );
    return response.data;
  }

  async getProfilePicUrl(contactId?: string): Promise<ApiResponse<{ profilePic: string }>> {
    // Clean the contactId to ensure it's just the phone number
    // The server-side will handle adding the proper WhatsApp suffix
    const cleanContactId = contactId ? contactId.replace(/[@c.us,@g.us]/g, '') : undefined;
    
    const endpoint = cleanContactId
      ? `/${this.session}/profile-pic/${cleanContactId}`
      : `/${this.session}/profile-pic`;
    
    const response: AxiosResponse<ApiResponse<{ profilePic: string }>> = await this.api.get(endpoint);
    return response.data;
  }

  async setProfilePic(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${this.session}/set-profile-pic`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Session Management
  async getAllSessions(): Promise<ApiResponse<string[]>> {
    const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/api/sessions');
    return response.data;
  }

  async deleteSession(sessionName: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(
      `/${sessionName}/delete-session`
    );
    return response.data;
  }

  async restartSession(sessionName: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/${sessionName}/restart-session`
    );
    return response.data;
  }

  // Utility Methods
  getSocket(): Socket {
    return this.socket;
  }

  getCurrentSession(): string {
    return this.session;
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  // Session termination methods
  async terminateSession(options: {
    type: 'close' | 'logout';
    clearData?: boolean;
  }): Promise<ApiResponse<any>> {
    const { type, clearData = false } = options;
    
    try {
      let response: ApiResponse<any>;
      
      if (type === 'logout') {
        response = await this.logoutSession(this.session);
      } else {
        response = await this.closeSession(this.session);
      }
      
      // If successful and clearData is true, clear local storage
      if (response.status && clearData) {
        this.clearLocalData();
      }
      
      return response;
    } catch (error) {
      console.error(`Error during session ${type}:`, error);
      throw error;
    }
  }

  private clearLocalData(): void {
    localStorage.removeItem('wpp_session');
    localStorage.removeItem('wpp_token');
    this.disconnectSocket();
    this.session = '';
    this.token = '';
  }

  // Enhanced logout with better error handling and options
  async logout(options: {
    force?: boolean;
    clearData?: boolean;
  } = {}): Promise<void> {
    const { force = false, clearData = true } = options;
    
    try {
      // Try to logout from server if session exists
      if (this.session && !force) {
        await this.logoutSession(this.session);
      }
      
      if (clearData) {
        this.clearLocalData();
      }
      
    } catch (error) {
      console.error('Error during logout:', error);
      
      // If force is true or if we get a network error, still clear local data
      if (force || this.isNetworkError(error)) {
        console.warn('Force clearing local data due to error or force flag');
        if (clearData) {
          this.clearLocalData();
        }
      } else {
        throw error;
      }
    }
  }

  // Disconnect and show QR code again - logout but keep session for reconnection
  async disconnectAndShowQR(): Promise<void> {
    try {
      console.log('Disconnecting session and preparing for QR code...');
      
      // Logout from WhatsApp but keep token for reconnection
      if (this.session) {
        await this.logoutSession(this.session);
      }
      
      // Clear connection state but keep session data for reconnection
      this.disconnectSocket();
      
      // Don't clear session and token - keep them for reconnection
      console.log('Session disconnected, ready for QR code reconnection');
    } catch (error) {
      console.error('Error during disconnect:', error);
      throw error;
    }
  }

  // Force logout - clears everything regardless of server response
  async forceLogout(): Promise<void> {
    console.warn('Performing force logout - clearing all local data');
    await this.logout({ force: true, clearData: true });
  }

  private isNetworkError(error: any): boolean {
    return (
      !navigator.onLine ||
      error.code === 'NETWORK_ERROR' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_NETWORK') ||
      !error.response
    );
  }

  // Session status checking with timeout
  async checkSessionHealth(): Promise<{
    isConnected: boolean;
    sessionExists: boolean;
    error?: string;
  }> {
    try {
      // Check connection with timeout
      const response = await Promise.race([
        this.checkConnection(this.session),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection check timeout')), 5000)
        )
      ]);
      
      return {
        isConnected: response.response?.status || false,
        sessionExists: true,
      };
    } catch (error: any) {
      return {
        isConnected: false,
        sessionExists: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

// Create singleton instance
const wppAPI = new WppConnectAPI();

export default wppAPI;
export { WppConnectAPI };