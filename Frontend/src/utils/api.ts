import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Auto-detect host IP for physical devices running Expo Go
const getBaseUrl = () => {
  // If running in development with Expo Go, try to use the host URI
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/v1`;
  }
  // Fallback for emulator / simulator
  return 'http://127.0.0.1:3000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// Memory cache for tokens to avoid repeated AsyncStorage reads
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

export const setTokens = async (accessToken: string, refreshToken: string) => {
  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  await Promise.all([
    AsyncStorage.setItem('accessToken', accessToken),
    AsyncStorage.setItem('refreshToken', refreshToken),
  ]);
};

export const clearTokens = async () => {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  await Promise.all([
    AsyncStorage.removeItem('accessToken'),
    AsyncStorage.removeItem('refreshToken'),
  ]);
};

export const getAccessToken = async () => {
  if (cachedAccessToken) return cachedAccessToken;
  cachedAccessToken = await AsyncStorage.getItem('accessToken');
  return cachedAccessToken;
};

export const getRefreshToken = async () => {
  if (cachedRefreshToken) return cachedRefreshToken;
  cachedRefreshToken = await AsyncStorage.getItem('refreshToken');
  return cachedRefreshToken;
};

/**
 * Generic API Fetch wrapper with auto token refresh and error handling.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    let response = await fetch(url, { ...rest, headers });

    // Handle token expiration (410 / 401 Unauthorized)
    if (response.status === 401 && !skipAuth) {
      // Try to refresh token
      const isRefreshed = await refreshSessionTokens();
      if (isRefreshed) {
        // Retry original request with new token
        const newToken = await getAccessToken();
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...rest, headers });
      } else {
        throw new Error('Session expired. Please log in again.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data as T;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

/**
 * Call refresh endpoint to obtain new access and refresh tokens.
 */
async function refreshSessionTokens(): Promise<boolean> {
  const rToken = await getRefreshToken();
  if (!rToken) return false;

  try {
    const url = `${API_BASE_URL}/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const { tokens } = await response.json();
    await setTokens(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

// API Endpoints Mapping
export const api = {
  auth: {
    register: (data: any) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    login: (data: any) =>
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    logout: async () => {
      const rToken = await getRefreshToken();
      if (rToken) {
        try {
          await apiFetch('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: rToken }),
            skipAuth: true,
          });
        } catch (e) {
          console.warn('Logout request failed:', e);
        }
      }
      await clearTokens();
    },
  },
  user: {
    getProfile: () => apiFetch('/users/me'),
    updateProfile: (data: any) => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    getStats: () => apiFetch('/users/me/stats'),
    awardXp: (amount: number) => apiFetch('/users/me/xp', { method: 'POST', body: JSON.stringify({ customAmount: amount }) }),
    awardBadge: (badgeId: string) => apiFetch('/users/me/badge', { method: 'POST', body: JSON.stringify({ badgeId }) }),
  },
  documents: {
    list: (search?: string) => apiFetch(`/documents${search ? `?q=${encodeURIComponent(search)}` : ''}`),
    upload: (formData: FormData) =>
      apiFetch('/documents', {
        method: 'POST',
        body: formData,
        // Content-Type is auto set by browser/native for FormData
        headers: {},
      }),
    scanOcr: (base64Image: string) =>
      apiFetch('/ai/scan', { method: 'POST', body: JSON.stringify({ image: base64Image }) }),
    get: (id: string) => apiFetch(`/documents/${id}`),
    updateProgress: (id: string, progress: number, additionalSeconds: number) =>
      apiFetch(`/documents/${id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ progress, additionalSeconds }),
      }),
    rename: (id: string, title: string) =>
      apiFetch(`/documents/${id}/title`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    delete: (id: string) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
    addBookmark: (id: string, chunkIndex: number, wordIndex: number, note?: string) =>
      apiFetch(`/documents/${id}/bookmark`, {
        method: 'POST',
        body: JSON.stringify({ chunkIndex, wordIndex, note }),
      }),
    getQuiz: (id: string) => apiFetch(`/documents/${id}/quiz`),
    getFlashcards: (id: string) => apiFetch(`/documents/${id}/flashcards`),
    saveQuizResult: (id: string, quizId: string, score: number, total: number) =>
      apiFetch(`/documents/${id}/quiz-result`, {
        method: 'POST',
        body: JSON.stringify({ quizId, score, total, correctAnswers: score }),
      }),
  },
  ai: {
    simplify: (text: string) => apiFetch('/ai/simplify', { method: 'POST', body: JSON.stringify({ text }) }),
    summarize: (documentId: string) =>
      apiFetch('/ai/summarize', { method: 'POST', body: JSON.stringify({ documentId }) }),
    chat: (id: string, message: string, history: any[]) =>
      apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ documentId: id, message, history }) }),
    wordDefinition: (word: string) => apiFetch(`/ai/word/${encodeURIComponent(word)}`),
    pronunciation: (word: string) =>
      apiFetch('/ai/pronunciation', { method: 'POST', body: JSON.stringify({ word }) }),
    verifyPronunciation: (formData: FormData) =>
      apiFetch('/ai/pronounce/verify', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set boundary
      }),
  },
  vocabulary: {
    list: (filter?: 'mastered' | 'learning') =>
      apiFetch(`/vocabulary${filter ? `?filter=${filter}` : ''}`),
    add: (word: string) => apiFetch('/vocabulary', { method: 'POST', body: JSON.stringify({ word }) }),
    toggleMastery: (word: string, mastered: boolean) =>
      apiFetch(`/vocabulary/${encodeURIComponent(word)}/mastery`, { method: 'PATCH', body: JSON.stringify({ mastered }) }),
    getChallenge: () => apiFetch('/vocabulary/challenge'),
  },
  performance: {
    saveSession: (data: { documentId?: string; elapsedSeconds: number; wordsRead: number; accuracy: number }) =>
      apiFetch('/performance/session', { method: 'POST', body: JSON.stringify(data) }),
    getWeeklyWpm: () => apiFetch('/performance/weekly-wpm'),
    getReport: () => apiFetch('/performance/report'),
  },
  settings: {
    get: () => apiFetch('/settings'),
    save: (data: any) => apiFetch('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    reset: () => apiFetch('/settings/reset', { method: 'POST' }),
  },
};
