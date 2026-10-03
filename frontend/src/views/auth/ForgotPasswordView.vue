<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Mail, Lock, Eye, EyeOff, Home, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-vue-next';
import dashboardBg from '@/assets/dashboard-bg.png';
import apiClient from '@/services/api.client';

const router = useRouter();

// 2 bước: 1 = Nhập Email gửi OTP, 2 = Nhập OTP và Mật khẩu mới
const step = ref<1 | 2>(1);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const devOtpCode = ref('');

const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
});

const errors = reactive({
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
});

const validateStep1 = () => {
  errors.email = '';
  errorMessage.value = '';

  if (!form.email.trim()) {
    errors.email = 'Vui lòng nhập email tài khoản của bạn';
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Định dạng email không hợp lệ';
    return false;
  }
  return true;
};

const handleSendOtp = async () => {
  if (!validateStep1()) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response: any = await apiClient.post('/auth/forgot-password', {
      email: form.email.trim(),
    });

    const resData = response.data || response;
    successMessage.value = resData.message || 'Mã xác thực OTP đã được gửi đến email của bạn.';
    if (resData.devOtp) {
      devOtpCode.value = resData.devOtp;
    }
    step.value = 2;
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      'Không thể gửi mã OTP. Vui lòng thử lại sau.';
  } finally {
    isLoading.value = false;
  }
};

const validateStep2 = () => {
  let isValid = true;
  errors.otp = '';
  errors.newPassword = '';
  errors.confirmPassword = '';
  errorMessage.value = '';

  if (!form.otp.trim()) {
    errors.otp = 'Vui lòng nhập mã OTP gồm 6 chữ số';
    isValid = false;
  } else if (!/^\d{6}$/.test(form.otp.trim())) {
    errors.otp = 'Mã OTP phải gồm đúng 6 chữ số';
    isValid = false;
  }

  if (!form.newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    isValid = false;
  } else if (form.newPassword.length < 8) {
    errors.newPassword = 'Mật khẩu phải có tối thiểu 8 ký tự';
    isValid = false;
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword)) {
    errors.newPassword = 'Mật khẩu cần ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số';
    isValid = false;
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    isValid = false;
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    isValid = false;
  }

  return isValid;
};

const handleResetPassword = async () => {
  if (!validateStep2()) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response: any = await apiClient.post('/auth/reset-password', {
      email: form.email.trim(),
      otp: form.otp.trim(),
      new_password: form.newPassword,
    });

    const resData = response.data || response;
    successMessage.value = resData.message || 'Đặt lại mật khẩu thành công!';

    // Tự động chuyển hướng về trang đăng nhập sau 2 giây
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP!';
  } finally {
    isLoading.value = false;
  }
};

const fillDevOtp = () => {
  if (devOtpCode.value) {
    form.otp = devOtpCode.value;
  }
};
</script>

<template>
  <div
    class="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans bg-cover bg-center bg-no-repeat select-none"
    :style="{ backgroundImage: `url(${dashboardBg})` }"
  >
    <!-- Background Blur & Soft Overlay -->
    <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"></div>

    <!-- Header Mini Pill Bar -->
    <header class="relative z-20 px-6 sm:px-12 pt-5 flex items-center justify-between">
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold shadow-md backdrop-blur-md transition hover:scale-105 active:scale-95"
      >
        <Home class="w-3.5 h-3.5 text-brand-orange" />
        <span>Trang chủ</span>
      </router-link>

      <span class="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
        Trip<span class="text-brand-blue">Planner</span>
      </span>
    </header>

    <!-- Main Container Card -->
    <main class="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        
        <!-- Cột Trái: Polaroid & Lời nhắn -->
        <div class="lg:col-span-5 bg-gradient-to-br from-teal-50/80 via-white/40 to-orange-50/60 p-6 sm:p-8 flex flex-col justify-between items-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100">
          <div class="w-full text-center sm:text-left z-10">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              <KeyRound class="w-3 h-3 text-teal-600" />
              Bảo mật tài khoản
            </span>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Khôi phục mật khẩu
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              Đừng lo lắng, WanderFlow sẽ giúp bạn lấy lại quyền truy cập chuyến đi trong vài bước!
            </p>
          </div>

          <!-- Polaroid Card -->
          <div class="relative my-6 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
            <!-- Băng dính Washi Tape -->
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/90 border border-amber-200/60 shadow-xs rotate-2 z-20 pointer-events-none"></div>

            <div class="w-52 bg-white p-3 pb-5 rounded-sm shadow-xl border border-slate-200/80 flex flex-col items-center">
              <div class="w-full h-44 overflow-hidden rounded-xs bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80"
                  alt="Peaceful Travel"
                  class="w-full h-full object-cover"
                />
              </div>
              <p class="font-['Caveat',cursive] text-lg font-bold text-slate-700 mt-3 tracking-wide">
                safe & secure trips 🔐
              </p>
            </div>
          </div>

          <div class="text-[11px] text-slate-400 text-center w-full z-10">
            Cần hỗ trợ trực tiếp? <span class="text-teal-600 font-semibold cursor-pointer hover:underline">support@wanderflow.vn</span>
          </div>
        </div>

        <!-- Cột Phải: Form Khôi phục 2 Bước -->
        <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          <!-- Thông báo lỗi -->
          <div
            v-if="errorMessage"
            class="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Thông báo thành công -->
          <div
            v-if="successMessage"
            class="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold">{{ successMessage }}</p>
              <!-- Nút click tự động điền OTP nếu ở chế độ dev -->
              <div v-if="devOtpCode && step === 2" class="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition shadow-2xs flex items-center gap-1"
                  @click="fillDevOtp"
                >
                  <Sparkles class="w-3 h-3" />
                  Điền nhanh mã Dev OTP: {{ devOtpCode }}
                </button>
              </div>
            </div>
          </div>

          <!-- BƯỚC 1: NHẬP EMAIL -->
          <div v-if="step === 1">
            <h2 class="text-base font-bold text-slate-900 mb-1">
              Nhập email tài khoản của bạn
            </h2>
            <p class="text-xs text-slate-500 mb-6">
              Hệ thống sẽ gửi một mã xác thực OTP gồm 6 chữ số đến hòm thư của bạn.
            </p>

            <form class="space-y-4" @submit.prevent="handleSendOtp">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Email
                </label>
                <div class="relative rounded-xl">
                  <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="ví_dụ@gmail.com"
                    autocomplete="email"
                    class="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border transition focus:outline-none focus:ring-2 placeholder:text-slate-400"
                    :class="errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-orange focus:ring-orange-100'"
                  />
                </div>
                <p v-if="errors.email" class="mt-1 text-[11px] text-red-500 font-medium">
                  {{ errors.email }}
                </p>
              </div>

              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                <span v-if="isLoading">Đang xử lý...</span>
                <template v-else>
                  <span>Gửi mã xác thực OTP</span>
                  <ArrowRight class="w-4 h-4" />
                </template>
              </button>
            </form>
          </div>

          <!-- BƯỚC 2: NHẬP MÃ OTP VÀ MẬT KHẨU MỚI -->
          <div v-else>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">
                  Xác nhận mã OTP & Đặt mật khẩu mới
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Mã OTP gửi đến: <strong class="text-slate-800">{{ form.email }}</strong>
                </p>
              </div>
              <button
                type="button"
                class="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
                @click="step = 1"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                Đổi email
              </button>
            </div>

            <form class="space-y-3.5" @submit.prevent="handleResetPassword">
              <!-- Mã OTP -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Mã xác thực OTP (6 chữ số)
                </label>
                <div class="relative rounded-xl">
                  <KeyRound class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.otp"
                    type="text"
                    maxlength="6"
                    placeholder="Nhập 6 chữ số (ví dụ: 123456)"
                    class="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold tracking-widest rounded-xl border transition focus:outline-none focus:ring-2 placeholder:text-slate-400"
                    :class="errors.otp ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'"
                  />
                </div>
                <p v-if="errors.otp" class="mt-1 text-[11px] text-red-500 font-medium">
                  {{ errors.otp }}
                </p>
              </div>

              <!-- Mật khẩu mới -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới
                </label>
                <div class="relative rounded-xl">
                  <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="Tối thiểu 8 ký tự (hoa, thường, số)"
                    class="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border transition focus:outline-none focus:ring-2 placeholder:text-slate-400"
                    :class="errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-orange focus:ring-orange-100'"
                  />
                  <button
                    type="button"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <Eye v-if="!showNewPassword" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="errors.newPassword" class="mt-1 text-[11px] text-red-500 font-medium">
                  {{ errors.newPassword }}
                </p>
              </div>

              <!-- Xác nhận mật khẩu mới -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập lại mật khẩu mới
                </label>
                <div class="relative rounded-xl">
                  <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Xác nhận lại mật khẩu mới"
                    class="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border transition focus:outline-none focus:ring-2 placeholder:text-slate-400"
                    :class="errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-orange focus:ring-orange-100'"
                  />
                  <button
                    type="button"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="errors.confirmPassword" class="mt-1 text-[11px] text-red-500 font-medium">
                  {{ errors.confirmPassword }}
                </p>
              </div>

              <!-- Nút xác nhận -->
              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-4"
              >
                <span v-if="isLoading">Đang lưu thay đổi...</span>
                <template v-else>
                  <span>Xác nhận đặt lại mật khẩu</span>
                  <ArrowRight class="w-4 h-4" />
                </template>
              </button>
            </form>
          </div>

          <!-- Bottom Footer Navigation -->
          <div class="mt-6 pt-5 border-t border-slate-100 text-center">
            <router-link
              to="/login"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft class="w-3.5 h-3.5 text-slate-400" />
              <span>Quay lại trang Đăng nhập</span>
            </router-link>
          </div>

        </div>

      </div>
    </main>

    <!-- Mini Footer -->
    <footer class="relative z-20 py-4 text-center text-xs text-white/80">
      TripPlanner © 2026 Wanderflow. Khám phá trọn vẹn từng chuyến đi.
    </footer>
  </div>
</template>
