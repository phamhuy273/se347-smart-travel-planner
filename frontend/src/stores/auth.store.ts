import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient, { AUTH_SESSION_EVENT } from '../services/api.client';

export interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  fullName?: string;
  avatar_url?: string;
  avatarUrl?: string;
  bio?: string;
  phone_number?: string;
  is_verified?: boolean;
}

function parseStoredUser(raw: string | null): UserInfo | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let hasBoundSyncListeners = false;
let activeSyncHandler: (() => void) | null = null;

function ensureSyncListeners(syncHandler: () => void) {
  activeSyncHandler = syncHandler;
  if (typeof window === 'undefined' || hasBoundSyncListeners) return;

  window.addEventListener(AUTH_SESSION_EVENT, () => {
    activeSyncHandler?.();
  });

  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === null || event.key === 'access_token' || event.key === 'user_info') {
      activeSyncHandler?.();
    }
  });

  hasBoundSyncListeners = true;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<UserInfo | null>(parseStoredUser(localStorage.getItem('user_info')));

  const syncFromStorage = () => {
    token.value = localStorage.getItem('access_token');
    user.value = parseStoredUser(localStorage.getItem('user_info'));
  };

  ensureSyncListeners(syncFromStorage);

  const isAuthenticated = () => !!token.value;
  const isLoggedIn = computed(() => !!token.value);
  const displayName = computed(
    () => user.value?.full_name || user.value?.fullName || user.value?.email?.split('@')[0] || 'Người dùng',
  );

  function setAuth(accessToken: string, userInfo: UserInfo) {
    token.value = accessToken;
    user.value = userInfo;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }

  async function fetchProfile() {
    if (!token.value) return null;
    try {
      const response: any = await apiClient.get('/auth/me');
      const profileData = response.data || response;
      user.value = profileData;
      localStorage.setItem('user_info', JSON.stringify(profileData));
      return profileData;
    } catch {
      return null;
    }
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Swallowed: even if server is offline, client clears credentials
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isLoggedIn,
    displayName,
    setAuth,
    fetchProfile,
    logout,
  };
});
