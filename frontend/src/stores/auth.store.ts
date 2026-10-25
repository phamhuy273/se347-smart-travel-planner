import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/api.client';

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

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<UserInfo | null>(
    localStorage.getItem('user_info')
      ? JSON.parse(localStorage.getItem('user_info')!)
      : null,
  );

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
    } catch (error) {
      logout();
      return null;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
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
