// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  signup: async (username: string, email: string, password: string) => {
    const { data } = await api.post('/auth/signup', { username, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Scrapbook endpoints
export const scrapbooks = {
  list: async () => {
    const { data } = await api.get('/scrapbooks');
    return data.scrapbooks;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/scrapbooks/${id}`);
    return data.scrapbook;
  },

  create: async (scrapbookData: {
    title: string;
    themeCategory: string;
    isPrivate?: boolean;
  }) => {
    const { data } = await api.post('/scrapbooks', scrapbookData);
    return data.scrapbook;
  },

  update: async (id: string, updates: {
    title?: string;
    themeCategory?: string;
    isPrivate?: boolean;
  }) => {
    const { data } = await api.patch(`/scrapbooks/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/scrapbooks/${id}`);
    return data;
  },

  addSong: async (scrapbookId: string, songId: string) => {
    const { data } = await api.post(`/scrapbooks/${scrapbookId}/songs`, { songId });
    return data;
  },
};

// Page endpoints
export const pages = {
  create: async (scrapbookId: string, pageData: {
    pageOrder: number;
    backgroundColor?: string;
    backgroundImageUrl?: string;
  }) => {
    const { data } = await api.post(`/scrapbooks/${scrapbookId}/pages`, pageData);
    return data.page;
  },

  update: async (pageId: string, pageData: {
    backgroundColor?: string;
    backgroundImageUrl?: string;
    elements?: any[];
  }) => {
    const { data } = await api.put(`/pages/${pageId}`, pageData);
    return data;
  },

  addElement: async (pageId: string, elementData: {
    type: 'photo' | 'sticker' | 'text';
    xPos: number;
    yPos: number;
    rotation?: number;
    scale?: number;
    zIndex: number;
    properties: any;
  }) => {
    const { data } = await api.post(`/pages/${pageId}/elements`, elementData);
    return data.element;
  },
};

// Song endpoints
export const songs = {
  list: async (search?: string) => {
    const { data } = await api.get('/songs', { params: { search } });
    return data.songs;
  },

  create: async (songData: {
    title: string;
    artist: string;
    fileUrl: string;
    durationSeconds: number;
  }) => {
    const { data } = await api.post('/songs', songData);
    return data.song;
  },
};

export default api;