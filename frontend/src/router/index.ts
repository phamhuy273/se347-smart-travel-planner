import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import PlannerLayout from '@/layouts/PlannerLayout.vue';
import { ensureSession, getSafeRedirect, hasActiveSession } from '@/services/api.client';

const routes: Array<RouteRecordRaw> = [
  // 1. Public Routes
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/landing/LandingView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('@/views/auth/VerifyEmailView.vue'),
  },

  // 2. Main Layout Routes (Màn 4 Dashboard & Màn 5 Chuyến đi)
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'trips',
        name: 'MyTrips',
        component: () => import('@/views/trips/MyTripsView.vue'),
      },
    ],
  },

  // 3. Planner Layout Routes (Màn 6 Xếp lịch & Mapbox)
  {
    path: '/planner',
    component: PlannerLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'PlannerDefault',
        component: () => import('@/views/planner/PlannerView.vue'),
      },
      {
        path: ':id',
        name: 'Planner',
        component: () => import('@/views/planner/PlannerView.vue'),
      },
    ],
  },

  // Fallback redirect
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guards (SW-11: Auth Protection)
router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);
  const isLanding = to.path === '/';

  const hasSession =
    requiresAuth || guestOnly || isLanding
      ? await ensureSession()
      : hasActiveSession();

  if (requiresAuth && !hasSession) {
    // Chưa đăng nhập mà truy cập trang bảo vệ -> redirect về login kèm redirect query
    return {
      path: '/login',
      query: { redirect: getSafeRedirect(to.fullPath) },
    };
  }

  if (guestOnly && hasSession) {
    // Đã đăng nhập rồi mà vào login/register/forgot-password -> redirect theo query hợp lệ hoặc dashboard
    const target = getSafeRedirect(to.query.redirect);
    const resolved = router.resolve(target);
    if (resolved.matched.some((record) => record.meta.guestOnly)) {
      return '/dashboard';
    }
    return target;
  }
});

export default router;
