<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-vue-next';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseInput from '@/components/common/BaseInput.vue';

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ email và mật khẩu';
    return;
  }
  loading.value = true;
  errorMessage.value = '';

  try {
    // In Sprint 1 development, simulate instant login or real API
    localStorage.setItem('access_token', 'dev_mock_jwt_token_2026');
    localStorage.setItem('user_info', JSON.stringify({ name: 'Pham Huy', email: email.value }));
    router.push('/dashboard');
  } catch (err: any) {
    errorMessage.value = err.message || 'Đăng nhập thất bại';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-screen flex items-center justify-center p-6 bg-cover bg-center relative" style="background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80')">
    <!-- Dim overlay -->
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"></div>

    <!-- Main Card Container (Postcard layout from Figma Màn 2) -->
    <div class="relative z-10 max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/40">
      <!-- Left side: Postcard vacation picture -->
      <div class="hidden md:flex flex-col justify-between p-8 bg-cover bg-center relative text-white" style="background-image: url('https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80')">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
        <div class="relative z-10 flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center shadow">
            <Sparkles class="w-5 h-5 text-white" />
          </div>
          <span class="font-extrabold text-xl tracking-tight text-white">TripPlanner</span>
        </div>

        <div class="relative z-10">
          <h3 class="text-2xl font-bold leading-snug">Khám phá những vùng đất mới cùng bạn bè</h3>
          <p class="text-xs text-white/80 mt-2">Đăng nhập để tiếp tục quản lý các chuyến đi đáng nhớ của bạn.</p>
        </div>
      </div>

      <!-- Right side: Login form -->
      <div class="p-8 md:p-10 flex flex-col justify-center">
        <div class="text-left mb-6">
          <h2 class="text-2xl font-bold text-slate-900">Chào mừng trở lại!</h2>
          <p class="text-xs text-slate-500 mt-1">Đăng nhập tài khoản để vào không gian lập kế hoạch.</p>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          class="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition shadow-xs mb-5"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.06 0 12s.45 3.78 1.25 5.39l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          Tiếp tục với Google
        </button>

        <div class="relative flex items-center justify-center mb-5">
          <div class="border-t border-slate-200 w-full"></div>
          <span class="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">hoặc email</span>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="example@gmail.com"
            required
          >
            <template #icon>
              <Mail class="w-4 h-4" />
            </template>
          </BaseInput>

          <BaseInput
            v-model="password"
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            required
          >
            <template #icon>
              <Lock class="w-4 h-4" />
            </template>
          </BaseInput>

          <div class="flex items-center justify-between text-xs">
            <label class="flex items-center gap-1.5 text-slate-600 cursor-pointer">
              <input type="checkbox" class="rounded text-brand-orange focus:ring-brand-orange border-slate-300" />
              <span>Ghi nhớ</span>
            </label>
            <a href="#" class="text-brand-orange hover:underline font-medium">Quên mật khẩu?</a>
          </div>

          <p v-if="errorMessage" class="text-xs text-red-500 font-medium text-left">
            {{ errorMessage }}
          </p>

          <BaseButton
            type="submit"
            size="md"
            :loading="loading"
            class="w-full mt-2"
          >
            Đăng nhập ->
          </BaseButton>
        </form>

        <p class="mt-6 text-xs text-slate-500 text-center">
          Chưa có tài khoản?
          <router-link to="/register" class="text-brand-orange font-bold hover:underline ml-1">
            Đăng ký ngay
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
