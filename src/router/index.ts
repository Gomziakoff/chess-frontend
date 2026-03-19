import { createRouter, createWebHistory } from 'vue-router'

import Main from '../views/Main.vue'
import Lobby from '../views/Lobby.vue'
import Game from '../views/Game.vue'
import Watch from '../views/Watch.vue'
import Login from '../views/Login.vue'
import Test from '../views/Test.vue'
import Test2 from '../views/Test2.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Main',
    component: Main,
  },
  {
    path: '/test',
    name: 'Test',
    component: Test,
  },
  {
    path: '/test2',
    name: 'Test2',
    component: Test2,
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: Lobby,
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: Game,
    props: true,
  },
  {
    path: '/watch/:id',
    name: 'Watch',
    component: Watch,
    props: true,
  },
  {
  path: '/login',
  component: Login
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (!auth.user) {
    await auth.fetchMe()
  }

  if (to.path !== '/login' && !auth.isAuthenticated) {
    return next('/login')
  }

  next()
})
