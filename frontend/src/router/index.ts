import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import PlannerLayout from '@/layouts/PlannerLayout.vue';

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
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
  },

  // 2. Main Layout Routes (Màn 4 Dashboard & Màn 5 Chuyến đi)
  {
    path: '/',
    component: MainLayout,
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
    children: [
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

export default router;
