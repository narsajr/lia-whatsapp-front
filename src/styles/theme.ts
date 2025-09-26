import { Theme } from '../types';

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#00a884',
    secondary: '#008069',
    background: '#111b21',
    surface: '#202c33',
    text: '#e9edef',
    textSecondary: '#8696a0',
    border: '#2a3942',
    messageOwn: '#005c4b',
    messageOther: '#202c33',
    online: '#00a884',
    accent: '#00a884',
    danger: '#f15c6d',
    success: '#00a884',
    warning: '#ffb700',
  },
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#00a884',
    secondary: '#008069',
    background: '#f0f2f5',
    surface: '#ffffff',
    text: '#111b21',
    textSecondary: '#667781',
    border: '#e9edef',
    messageOwn: '#d9fdd3',
    messageOther: '#ffffff',
    online: '#00a884',
    accent: '#00a884',
    danger: '#f15c6d',
    success: '#00a884',
    warning: '#ffb700',
  },
};

export const defaultTheme = darkTheme;