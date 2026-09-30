import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<UserInfo | null>(
    localStorage.getItem('user_info')
      ? JSON.parse(localStorage.getItem('user_info')!)
      : null,
  );

  const isAuthenticated = () => !!token.value;

  function setAuth(accessToken: string, userInfo: UserInfo) {
    token.value = accessToken;
    user.value = userInfo;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
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
    setAuth,
    logout,
  };
});
