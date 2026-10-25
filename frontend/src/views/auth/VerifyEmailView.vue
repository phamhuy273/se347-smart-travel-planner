<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, Home } from 'lucide-vue-next';
import authBg from '@/assets/auth-bg.png';
import apiClient from '@/services/api.client';
import { useAuthStore } from '@/stores/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('');
const countdown = ref(2);
const userEmail = ref('');
const isResending = ref(false);
const resendSuccess = ref(false);

const handleVerify = async () => {
  const token = route.query.token as string;
  const email = route.query.email as string;
  userEmail.value = email || '';

  if (!token || !email) {
    status.value = 'error';
    message.value = 'Liên kết xác nhận không hợp lệ hoặc thiếu thông tin cần thiết.';
    return;
  }

  status.value = 'loading';
  try {
    const response: any = await apiClient.get('/auth/verify-email', {
      params: { token, email },
    });

    const data = response.data || response;
    status.value = 'success';
    message.value = data.message || 'Xác thực tài khoản thành công!';

    // Tự động đếm ngược 2s rồi chuyển hướng sang trang Đăng nhập
    const interval = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        clearInterval(interval);
        router.push({
          path: '/login',
          query: { verified: 'true', email: userEmail.value },
        });
      }
    }, 1000);
  } catch (err: any) {
    status.value = 'error';
    message.value =
      err?.response?.data?.message ||
      err?.message ||
      'Liên kết xác nhận không hợp lệ hoặc đã hết hạn sử dụng. Vui lòng đăng ký lại hoặc yêu cầu gửi lại email!';
  }
};

const handleResend = async () => {
  if (!userEmail.value || isResending.value) return;
  isResending.value = true;
  resendSuccess.value = false;
  try {
    await apiClient.post('/auth/resend-verification', { email: userEmail.value });
    resendSuccess.value = true;
  } catch (err: any) {
    message.value = err?.response?.data?.message || 'Không thể gửi lại email xác nhận.';
  } finally {
    isResending.value = false;
  }
};

onMounted(() => {
  handleVerify();
});
</script>

<template>
  <div
    class="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans bg-cover bg-center bg-no-repeat select-none"
    :style="{ backgroundImage: `url(${authBg})` }"
  >
    <!-- Background overlay for gentle contrast -->
    <div class="absolute inset-0 bg-sky-900/15 pointer-events-none"></div>

    <!-- Header -->
    <header class="relative z-20 w-full px-4 sm:px-10 pt-5 sm:pt-7">
      <div
        class="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-sm"
      >
        <router-link to="/" class="flex items-center gap-1 group">
          <span class="text-2xl font-black tracking-tight text-slate-800 group-hover:text-brand-orange transition">
            Trip<span class="text-brand-blue">Planner</span>
          </span>
        </router-link>

        <router-link
          to="/"
          class="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-orange transition px-3 py-1.5 rounded-full hover:bg-slate-100/60"
        >
          <Home class="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </router-link>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 flex-1 max-w-lg w-full mx-auto px-4 py-12 flex items-center justify-center">
      <div class="w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/80 text-center">
        
        <!-- 1. LOADING STATE -->
        <div v-if="status === 'loading'" class="py-10 flex flex-col items-center">
          <div class="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center mb-5 text-teal-600">
            <Loader2 class="w-8 h-8 animate-spin" />
          </div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">Đang xác thực tài khoản...</h2>
          <p class="text-xs text-slate-500 max-w-xs">
            Hệ thống đang kiểm tra liên kết xác nhận email của bạn. Vui lòng chờ trong giây lát!
          </p>
        </div>

        <!-- 2. SUCCESS STATE -->
        <div v-else-if="status === 'success'" class="py-6 flex flex-col items-center">
          <div class="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-5 text-emerald-600 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-extrabold text-slate-800 mb-2">Kích hoạt thành công! 🎉</h2>
          <p class="text-xs text-slate-600 max-w-sm mb-6 leading-relaxed">
            Email của bạn đã được xác minh thành công. Chào mừng bạn gia nhập cộng đồng TripPlanner!
          </p>

          <div class="w-full p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-6 flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium">
            <span>Tự động chuyển sang trang Đăng nhập trong </span>
            <span class="font-extrabold text-emerald-600 text-sm bg-white px-2 py-0.5 rounded-md shadow-2xs">{{ countdown }}s</span>
          </div>

          <button
            type="button"
            class="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
            @click="router.push({ path: '/login', query: { verified: 'true', email: userEmail } })"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <!-- 3. ERROR STATE -->
        <div v-else class="py-6 flex flex-col items-center">
          <div class="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-5 text-red-600 shadow-lg shadow-red-500/10">
            <AlertCircle class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-extrabold text-slate-800 mb-2">Xác thực thất bại</h2>
          <p class="text-xs text-red-600 bg-red-50/80 border border-red-200 p-3 rounded-xl mb-6 max-w-sm leading-relaxed">
            {{ message }}
          </p>

          <div v-if="resendSuccess" class="mb-4 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl w-full">
            Đã gửi lại email xác nhận mới! Vui lòng kiểm tra hộp thư của bạn.
          </div>

          <div class="w-full space-y-2.5">
            <button
              v-if="userEmail"
              type="button"
              :disabled="isResending"
              class="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
              @click="handleResend"
            >
              <Mail class="w-4 h-4 text-slate-500" />
              <span>{{ isResending ? 'Đang gửi...' : 'Gửi lại email kích hoạt' }}</span>
            </button>

            <router-link
              to="/login"
              class="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Về trang Đăng nhập</span>
              <ArrowRight class="w-4 h-4" />
            </router-link>
          </div>
        </div>

      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full text-center py-3 text-[11px] text-slate-600/80">
      © 2026 TripPlanner (Wanderflow). All rights reserved.
    </footer>
  </div>
</template>
