<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { User, Mail, Lock, Sparkles } from 'lucide-vue-next';
import BaseButton from '@/components/common/BaseButton.vue';
import BaseInput from '@/components/common/BaseInput.vue';

const router = useRouter();

const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Vui lòng điền đầy đủ các thông tin';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không khớp';
    return;
  }
  loading.value = true;
  errorMessage.value = '';

  try {
    // In Sprint 1 development, simulate instant registration
    localStorage.setItem('access_token', 'dev_mock_jwt_token_2026');
    localStorage.setItem('user_info', JSON.stringify({ name: fullName.value, email: email.value }));
    router.push('/dashboard');
  } catch (err: any) {
    errorMessage.value = err.message || 'Đăng ký thất bại';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-screen flex items-center justify-center p-6 bg-cover bg-center relative" style="background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80')">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"></div>

    <div class="relative z-10 max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/40">
      <!-- Left side postcard picture -->
      <div class="hidden md:flex flex-col justify-between p-8 bg-cover bg-center relative text-white" style="background-image: url('https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80')">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
        <div class="relative z-10 flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center shadow">
            <Sparkles class="w-5 h-5 text-white" />
          </div>
          <span class="font-extrabold text-xl tracking-tight text-white">TripPlanner</span>
        </div>

        <div class="relative z-10">
          <h3 class="text-2xl font-bold leading-snug">Khởi đầu hành trình mới của bạn hôm nay</h3>
          <p class="text-xs text-white/80 mt-2">Tạo tài khoản miễn phí và bắt đầu sắp xếp chuyến du lịch mơ ước.</p>
        </div>
      </div>

      <!-- Right side register form -->
      <div class="p-8 md:p-10 flex flex-col justify-center">
        <div class="text-left mb-5">
          <h2 class="text-2xl font-bold text-slate-900">Tạo tài khoản</h2>
          <p class="text-xs text-slate-500 mt-1">Gia nhập cộng đồng người yêu du lịch thông minh.</p>
        </div>

        <form class="space-y-3.5" @submit.prevent="handleRegister">
          <BaseInput
            v-model="fullName"
            label="Họ và tên"
            type="text"
            placeholder="Pham Huy"
            required
          >
            <template #icon>
              <User class="w-4 h-4" />
            </template>
          </BaseInput>

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
            placeholder="Tối thiểu 6 ký tự"
            required
          >
            <template #icon>
              <Lock class="w-4 h-4" />
            </template>
          </BaseInput>

          <BaseInput
            v-model="confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="Nhập lại mật khẩu"
            required
          >
            <template #icon>
              <Lock class="w-4 h-4" />
            </template>
          </BaseInput>

          <p v-if="errorMessage" class="text-xs text-red-500 font-medium text-left">
            {{ errorMessage }}
          </p>

          <BaseButton
            type="submit"
            size="md"
            :loading="loading"
            class="w-full mt-3"
          >
            Đăng ký ->
          </BaseButton>
        </form>

        <p class="mt-5 text-xs text-slate-500 text-center">
          Đã có tài khoản?
          <router-link to="/login" class="text-brand-orange font-bold hover:underline ml-1">
            Đăng nhập ngay
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
