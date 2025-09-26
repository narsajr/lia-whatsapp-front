// API Response Types
export interface ApiResponse<T = any> {
  status: string;
  response: T;
  mapper?: string;
  error?: string;
}

// Message Types
export interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  self?: string;
  t: number;
  chatId: string | ContactId;
  author?: string;
  type: string;
  senderName?: string;
  caption?: string;
  deprecatedMms3Url?: string;
  directPath?: string;
  encFilehash?: string;
  filehash?: string;
  uploadhash?: string;
  mediaKey?: string;
  filename?: string;
  mimetype?: string;
  clientUrl?: string;
  mediaData?: any;
  isNewMsg?: boolean;
  linkPreview?: boolean;
  mentionedJidList?: string[];
  isForwarded?: boolean;
  labels?: string[];
  sender?: Contact;
  timestamp: number;
  quotedMsg?: Message;
  quotedMsgObj?: Message;
  mediaKeyTimestamp?: number;
  inviteV4?: string;
  inviteV4Code?: string;
  inviteV4CodeExp?: number;
  to?: string;
  content?: string;
  from?: string;
  ack?: number;
  rowId?: number;
  viewed?: boolean;
  isGroupMsg?: boolean;
  subtype?: string;
  star?: boolean;
  kicNotified?: boolean;
  isFromTemplate?: boolean;
  pollOptions?: any[];
  pollInvalidated?: boolean;
  isSentCagPollCreation?: boolean;
  pollVotesSnapshot?: any;
  latestEditMsgKey?: any;
  latestEditSenderTimestampMs?: any;
  broadcast?: boolean;
  groupMentions?: any[];
  isEventCanceled?: boolean;
  eventInvalidated?: boolean;
  isVcardOverMmsDocument?: boolean;
  isQuestion?: boolean;
  hasReaction?: boolean;
  viewMode?: string;
  messageSecret?: any;
  productHeaderImageRejected?: boolean;
  lastPlaybackProgress?: number;
  isDynamicReplyButtonsMsg?: boolean;
  isCarouselCard?: boolean;
  parentMsgId?: any;
  callSilenceReason?: any;
  isVideoCall?: boolean;
  callDuration?: any;
  callCreator?: any;
  callParticipants?: any;
  isCallLink?: any;
  callLinkToken?: any;
  isMdHistoryMsg?: boolean;
  stickerSentTs?: number;
  isAvatar?: boolean;
  lastUpdateFromServerTs?: number;
  invokedBotWid?: any;
  botTargetSenderJid?: any;
  bizBotType?: any;
  botResponseTargetId?: any;
  botPluginType?: any;
  botPluginReferenceIndex?: any;
  botPluginSearchProvider?: any;
  botPluginSearchUrl?: any;
  botPluginSearchQuery?: any;
  botPluginMaybeParent?: boolean;
  botReelPluginThumbnailCdnUrl?: any;
  botMessageDisclaimerText?: any;
  botMsgBodyType?: any;
  requiresDirectConnection?: any;
  bizContentPlaceholderType?: any;
  hostedBizEncStateMismatch?: boolean;
  senderOrRecipientAccountTypeHosted?: boolean;
  placeholderCreatedWhenAccountIsHosted?: boolean;
  galaxyFlowDisabled?: boolean;
  disappearingModeInitiator?: string;
  disappearingModeTrigger?: string;
  disappearingModeInitiatedByMe?: boolean;
  originalSelfAuthor?: ContactId;
  invis?: boolean;
  urlText?: any;
  urlNumber?: any;
  rcat?: any;
  isCaptionByUser?: boolean;
  size?: number;
  pageCount?: number;
}

// Contact Types
export interface Contact {
  id: ContactId;
  name?: string;
  shortName?: string;
  pushname?: string;
  type?: string;
  verifiedName?: string;
  statusMute?: boolean;
  labels?: string[];
  formattedName?: string;
  displayName?: string;
  wa_business?: any;
  isMe?: boolean;
  isUser?: boolean;
  isGroup?: boolean;
  isWAContact?: boolean;
  isMyContact?: boolean;
  isBlocked?: boolean;
  userid?: string;
  isEnterprise?: boolean;
  verifiedLevel?: number;
  profilePicThumbObj?: ProfilePic;
  msgs?: Message[];
}

export interface ContactId {
  server: string;
  user: string;
  _serialized: string;
}

export interface ProfilePic {
  eurl?: string;
  id?: ContactId;
  img?: string;
  imgFull?: string;
  raw?: any;
  tag?: string;
}

// Chat Types
export interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  isReadOnly: boolean;
  unreadCount: number;
  timestamp: number;
  archived: boolean;
  pinned: boolean;
  isMuted: boolean;
  muteExpiration: number;
  contact?: Contact;
  groupMetadata?: GroupMetadata;
  msgs: Message[];
  lastMessage?: Message;
  kind?: string;
  isOnline?: boolean;
  lastSeen?: number;
  presence?: {
    id: string;
    chatstates: any[];
  };
}

export interface GroupMetadata {
  id: ContactId;
  creation: number;
  owner: ContactId;
  participants: GroupParticipant[];
  pendingParticipants: GroupParticipant[];
  size: number;
  support: boolean;
  suspend: boolean;
  terminated: boolean;
  uniqueShortNameMap: any;
  isLidAddressingMode: boolean;
  isParentGroup: boolean;
  isParentGroupClosed: boolean;
  defaultSubgroup: boolean;
  generalSubgroup: boolean;
  generalChatAutoAddDisabled: boolean;
  allowNonAdminSubGroupCreation: boolean;
  lastActivityTimestamp: number;
  lastSeenActivityTimestamp: number;
  incognito: boolean;
  hasCapi: boolean;
  participants_count: number;
  desc?: string;
  descId?: string;
  descTime?: number;
  descOwner?: ContactId;
  restrict?: boolean;
  announce?: boolean;
  noFrequentlyForwarded?: boolean;
  ephemeralDuration?: number;
  membershipApprovalMode?: boolean;
  memberAddMode?: string;
  joinApprovalMode?: boolean;
  reportToAdminMode?: boolean;
}

export interface GroupParticipant {
  id: ContactId;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// Session Types
export interface SessionStatus {
  status: 'INITIALIZING' | 'AUTHENTICATING' | 'READY' | 'CLOSED' | 'CONNECTED';
  qrcode?: string;
  urlcode?: string;
  version?: string;
}

// UI State Types
export interface ChatUIState {
  selectedChat?: Chat;
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
  recordingTime: number;
  showEmojiPicker: boolean;
  messageInput: string;
  replyingTo?: Message;
  searchQuery: string;
  filteredChats: Chat[];
}

// Audio Recording Types
export interface AudioRecording {
  blob: Blob;
  duration: number;
  url: string;
}

// Theme Types
export interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    messageOwn: string;
    messageOther: string;
    online: string;
    accent: string;
    danger: string;
    success: string;
    warning: string;
  };
}

// API Request Types
export interface SendMessageRequest {
  phone: string;
  message: string;
  isGroup?: boolean;
  options?: {
    quotedMsg?: string;
    mentionedJidList?: string[];
    linkPreview?: boolean;
  };
}

export interface SendFileRequest {
  phone: string;
  base64: string;
  filename: string;
  caption?: string;
  isGroup?: boolean;
  options?: {
    quotedMsg?: string;
  };
}

export interface SendVoiceRequest {
  phone: string;
  base64Ptt: string;
  quotedMessageId?: string;
}