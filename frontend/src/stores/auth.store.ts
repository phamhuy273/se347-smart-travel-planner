import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient, {
  AUTH_SESSION_EVENT,
  getAccessToken,
  getSessionUser,
  setAuthSession,
  setSessionUser,
  logoutSession,
} from '../services/api.client';

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

let hasBoundSyncListeners = false;
let activeSyncHandler: ((token: string | null, user: UserInfo | null) => void) | null = null;

function ensureSyncListeners(syncHandler: (token: string | null, user: UserInfo | null) => void) {
  activeSyncHandler = syncHandler;
  if (typeof window === 'undefined' || hasBoundSyncListeners) return;

  window.addEventListener(AUTH_SESSION_EVENT, (event: Event) => {
    const detail = (event as CustomEvent<{ token?: string | null; user?: UserInfo | null }>).detail;
    activeSyncHandler?.(
      detail && 'token' in detail ? (detail.token ?? null) : getAccessToken(),
      detail && 'user' in detail ? (detail.user ?? null) : getSessionUser<UserInfo>(),
    );
  });

  hasBoundSyncListeners = true;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getAccessToken());
  const user = ref<UserInfo | null>(getSessionUser<UserInfo>());

  const syncFromSession = (nextToken: string | null, nextUser: UserInfo | null) => {
    token.value = nextToken;
    user.value = nextUser;
  };

  ensureSyncListeners(syncFromSession);

  const isAuthenticated = () => !!token.value;
  const isLoggedIn = computed(() => !!token.value);
  const displayName = computed(
    () => user.value?.full_name || user.value?.fullName || user.value?.email?.split('@')[0] || 'Người dùng',
  );

  function setAuth(accessToken: string, userInfo: UserInfo) {
    setAuthSession(accessToken, userInfo);
    syncFromSession(getAccessToken(), getSessionUser<UserInfo>());
  }

  async function fetchProfile() {
    if (!token.value) return null;
    try {
      const response: any = await apiClient.get('/auth/me');
      const profileData = response.data || response;
      const currentSessionUser = getSessionUser<UserInfo>();
      if (
        !getAccessToken() ||
        (currentSessionUser?.id != null &&
          profileData?.id != null &&
          String(currentSessionUser.id) !== String(profileData.id))
      ) {
        return null;
      }
      setSessionUser(profileData);
      syncFromSession(getAccessToken(), getSessionUser<UserInfo>());
      return profileData;
    } catch {
      return null;
    }
  }

  async function logout() {
    await logoutSession();
    syncFromSession(getAccessToken(), getSessionUser<UserInfo>());
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
