<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Mail, Lock, Eye, EyeOff, Home, ArrowRight, AlertCircle } from 'lucide-vue-next';
import dashboardBg from '@/assets/dashboard-bg.png';
import apiClient from '@/services/api.client';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const form = reactive({
  email: '',
  password: '',
});

const errors = reactive({
  email: '',
  password: '',
});

const validate = () => {
  let isValid = true;
  errors.email = '';
  errors.password = '';
  errorMessage.value = '';

  if (!form.email.trim()) {
    errors.email = 'Vui lòng nhập email';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Email không hợp lệ';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validate()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response: any = await apiClient.post('/auth/login', {
      email: form.email.trim(),
      password: form.password,
    });

    // Backend bọc trong TransformInterceptor: response = { statusCode, message, data: { user, accessToken } }
    const authData = response.data || response;
    authStore.setAuth(authData.accessToken, authData.user);

    // Chuyển hướng tới trang Dashboard
    router.push('/dashboard');
  } catch (err: any) {
    errorMessage.value =
      err?.message ||
      err?.response?.data?.message ||
      'Email hoặc mật khẩu không chính xác. Vui lòng thử lại!';
  } finally {
    isLoading.value = false;
  }
};

const finishGoogleAuth = async (credential: string, email?: string, full_name?: string) => {
  const response: any = await apiClient.post('/auth/google', {
    credential,
    email,
    full_name,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  });

  const authData = response.data || response;
  authStore.setAuth(authData.accessToken, authData.user);
  router.push('/dashboard');
};

const handleGoogleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (googleClientId && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (res: any) => {
          if (res?.credential) {
            await finishGoogleAuth(res.credential);
          }
        },
      });
      (window as any).google.accounts.id.prompt();
      return;
    }

    // Dev Mock Google Sign-In
    await finishGoogleAuth('mock:google_traveler', 'google.wanderer@gmail.com', 'Google Explorer');
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      'Đăng nhập Google thất bại. Vui lòng thử lại!';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans bg-cover bg-center bg-no-repeat select-none"
    :style="{ backgroundImage: `url(${dashboardBg})` }"
  >
    <!-- Background overlay for gentle contrast -->
    <div class="absolute inset-0 bg-sky-900/10 pointer-events-none"></div>

    <!-- 1. FLOATING HEADER (Chuẩn Figma) -->
    <header class="relative z-20 w-full px-4 sm:px-10 pt-5 sm:pt-7">
      <div
        class="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-sm"
      >
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-1 group">
          <span class="text-2xl font-black tracking-tight text-slate-800 group-hover:text-brand-orange transition">
            Trip<span class="text-brand-blue">Planner</span>
          </span>
        </router-link>

        <!-- Back to Home Button -->
        <router-link
          to="/"
          class="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-orange transition px-3 py-1.5 rounded-full hover:bg-slate-100/60"
        >
          <Home class="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </header>

    <!-- 2. MAIN CONTENT (Split View: Postcard bên trái & Form bên phải) -->
    <main class="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex items-center justify-between gap-8 lg:gap-16">
      
      <!-- LEFT SIDE: Tilted Polaroid Postcard & Slogan (Chuẩn Figma 100%) -->
      <div class="hidden lg:flex flex-col items-start max-w-lg pl-4">
        <!-- Handwriting Slogan -->
        <h2 class="font-handwriting text-3xl xl:text-4xl font-bold text-teal-800 tracking-wide mb-6 -rotate-2 drop-shadow-xs">
          Mỗi hành trình đáng nhớ<br />
          đều bắt đầu từ một kế hoạch.
        </h2>

        <!-- Postcard Card with tape and stamp -->
        <div class="relative group transition-transform duration-300 hover:rotate-0 -rotate-3 mt-2">
          <!-- Scotch Tape effect at top-left -->
          <div class="absolute -top-3.5 -left-4 w-16 h-7 bg-amber-100/80 border border-amber-200/60 -rotate-45 backdrop-blur-xs shadow-xs z-20 pointer-events-none rounded-xs"></div>

          <!-- White Photo Frame -->
          <div class="bg-white p-3.5 pb-12 rounded-2xl shadow-2xl border border-white/80 w-[380px] xl:w-[420px]">
            <!-- Inner Photo -->
            <div class="w-full h-64 xl:h-72 rounded-xl overflow-hidden shadow-inner relative">
              <img
                :src="dashboardBg"
                alt="Tropical Bay"
                class="w-full h-full object-cover object-bottom"
              />
            </div>
          </div>

          <!-- Postage Stamp Badge at bottom left -->
          <div
            class="absolute bottom-2 left-6 bg-white px-3 py-2 rounded-lg shadow-md border border-slate-200/80 flex items-center gap-2.5 z-20 -rotate-6"
          >
            <div class="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 leading-tight">
                Good Trips
              </div>
              <div class="text-[9px] font-medium text-slate-500 leading-tight">
                Better Memories ♥
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT SIDE: LOGIN CARD (Chuẩn Figma 100%) -->
      <div class="w-full max-w-[420px] mx-auto lg:mx-0">
        <div class="bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/80 transition-all">
          
          <!-- Card Header -->
          <div class="text-center mb-6">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Chào mừng <span class="text-teal-600">trở lại!</span>
            </h1>
            <p class="text-xs text-slate-500 mt-1.5">
              Đăng nhập để tiếp tục lên kế hoạch cho những chuyến đi đáng nhớ
            </p>
          </div>

          <!-- Alert Error Message -->
          <div
            v-if="errorMessage"
            class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Google Login Button -->
          <button
            type="button"
            :disabled="isLoading"
            class="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-70"
            @click="handleGoogleLogin"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          <!-- Divider -->
          <div class="relative my-4 text-center">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <span class="relative bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              hoặc
            </span>
          </div>

          <!-- Form Fields -->
          <form class="space-y-3.5" @submit.prevent="handleLogin">
            <!-- Email -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <div class="relative rounded-xl">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  autocomplete="email"
                  class="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border transition focus:outline-none focus:ring-2 placeholder:text-slate-400"
                  :class="errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-orange focus:ring-orange-100'"
                />
              </div>
              <p v-if="errors.email" class="mt-1 text-[11px] text-red-500 font-medium">
                {{ errors.email }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <router-link
                  to="/forgot-password"
                  class="text-[11px] font-medium text-teal-600 hover:text-teal-700 hover:underline transition"
                >
                  Quên mật khẩu?
                </router-link>
              </div>
              <div class="relative rounded-xl">
                <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Nhập mật khẩu"
                  autocomplete="current-password"
                  class="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border transition focus:outline-none focus:ring-2 placeholder:text-slate-400"
                  :class="errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-orange focus:ring-orange-100'"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.password" class="mt-1 text-[11px] text-red-500 font-medium">
                {{ errors.password }}
              </p>
            </div>

            <!-- Submit Button (Figma Orange Pill Button) -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full mt-5 py-3 px-6 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <svg
                v-if="isLoading"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập →' }}</span>
            </button>
          </form>

          <!-- Footer Switch to Register -->
          <div class="text-center mt-5 text-xs text-slate-500">
            Chưa có tài khoản?
            <router-link
              to="/register"
              class="font-bold text-teal-600 hover:text-teal-700 hover:underline ml-1 transition"
            >
              Đăng ký ngay
            </router-link>
          </div>

        </div>
      </div>

    </main>

    <!-- 3. FOOTER COPYRIGHT / PADDING -->
    <footer class="relative z-10 w-full text-center py-4 text-[11px] text-slate-600/80">
      © 2026 TripPlanner (Wanderflow). All rights reserved.
    </footer>
  </div>
</template>
