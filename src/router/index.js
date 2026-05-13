import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const LoginView                = () => import('@/views/LoginView.vue')
const DashboardView            = () => import('@/views/DashboardView.vue')
const AdminView                = () => import('@/views/AdminView.vue')
const AdminAttendanceRatesView = () => import('@/views/AdminAttendanceRatesView.vue')
const ClassesView              = () => import('@/views/ClassesView.vue')
const NotFound                 = () => import('@/views/NotFound.vue')
const FichesView               = () => import('@/views/FichesView.vue')
const FicheViewerView          = () => import('@/views/FicheViewerView.vue')

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },

  { path: '/classes', name: 'ClassesList', component: ClassesView, meta: { requiresAuth: true, roles: ['prof', 'admin'] } },
  { path: '/classes/:id', name: 'ClassPresence', component: DashboardView, meta: { requiresAuth: true, roles: ['prof', 'admin'] } },
  { path: '/dashboard/:id', name: 'DashboardView', component: DashboardView, props: true, meta: { requiresAuth: true } },

  { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/admin/attendance-rates', name: 'AdminAttendanceRates', component: AdminAttendanceRatesView, meta: { requiresAuth: true, roles: ['admin'] } },

  { path: '/mentions-legales', name: 'mentions-legales', component: () => import('@/views/MentionsLegalesView.vue'), meta: { public: true, title: 'Mentions légales' } },
  { path: '/privacy', name: 'privacy', component: () => import('@/views/ConfidentialiteView.vue'), meta: { public: true, title: 'Politique de confidentialité' } },
  { path: '/cookies', name: 'cookies', component: () => import('@/views/CookiesView.vue'), meta: { public: true, title: 'Politique cookies' } },

  { path: '/fiches', name: 'Fiches', component: FichesView, meta: { requiresAuth: true, roles: ['prof', 'admin'], title: 'Fiches de solfège' } },
  { path: '/fiches/:id', name: 'FicheViewer', component: FicheViewerView, meta: { requiresAuth: true, roles: ['prof', 'admin'], title: 'Fiches' } },

  // Doit rester en dernier : capture toutes les routes inconnues
  { path: '/:catchAll(.*)', name: 'NotFound', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // Bootstrap de session : charge /me + /classes si un token est présent
  try {
    await userStore.bootstrapOnce()
  } catch (e) {
    console.error('router bootstrap :', e)
  }

  const isAuthed = userStore.isLoggedIn
  const role = userStore.user?.role
  const landing = role === 'admin' ? '/admin' : '/classes'

  if (to.path === '/login' && isAuthed) return next(landing)
  if (to.path === '/') return next(isAuthed ? landing : '/login')
  if (to.meta?.requiresAuth && !isAuthed) return next('/login')

  const allowed = to.meta?.roles
  if (Array.isArray(allowed) && allowed.length && !allowed.includes(role)) {
    return next(landing)
  }

  next()
})

export default router
