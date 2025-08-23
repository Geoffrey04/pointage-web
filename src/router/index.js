import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// Import des vues
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AdminView from '@/views/AdminView.vue'
import NotFound from '@/views/NotFound.vue'
// import HomeView from '@/views/HomeView.vue'
import ClassesView from '@/views/ClassesView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAuth: true, adminOnly: true },
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: NotFound,
  },
  {
    path: '/classes/:id',
    name: 'ClassesView',
    component: ClassesView,
    // component: () => import('@/views/ClassesView.vue'),
    meta: { requiresAuth: true },
  },

  {
    path: '/classes/:id',
    name: 'Presence',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard/:id',
    name: 'DashboardView',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, role: 'prof' },
  },
  {
    path: '/classes',
    name: 'ClassesList',
    component: () => import('@/views/ClassesView.vue'),
    meta: { requiresAuth: true, role: 'prof' },
  },
  {
    path: '/presence/:id',
    name: 'Attendance',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }, // pas de role:'prof' => l’admin a accès
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Garde de navigation
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthed = userStore.isLoggedIn
  const isAdmin = userStore.user?.role === 'admin'
  const landing = isAdmin ? '/admin' : '/classes'

  // si on va sur /login alors qu'on est déjà connecté → page d'accueil selon rôle
  if (to.path === '/login' && isAuthed) {
    return next(landing)
  }

  // si on va sur la racine "/" → redirige dynamiquement
  if (to.path === '/') {
    return next(isAuthed ? landing : '/login')
  }

  // protections existantes
  if (to.meta?.requiresAuth && !isAuthed) {
    return next('/login')
  }
  if (to.meta?.adminOnly && !isAdmin) {
    return next(landing)
  }

  next()
})

export default router
