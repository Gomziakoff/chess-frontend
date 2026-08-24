import { createRouter, createWebHistory } from "vue-router";

import Main from "../views/Main.vue";
import Lobby from "../views/Lobby.vue";
import Game from "../views/Game.vue";
import Watch from "../views/Watch.vue";
import Login from "../views/Login.vue";
import Test from "../views/Test.vue";
import Analysis from "../views/Analysis.vue";
import { useAuthStore } from "../stores/auth";
import AnalysisId from "../views/AnalysisId.vue";
import HumanityAnalysis from "../views/HumanityAnalysis.vue";
import BotGame from "../views/BotGame.vue";
import Profile from "../views/Profile.vue";
import OpeningDrill from "../views/OpeningDrill.vue";
import SupportPage from "../views/SupportPage.vue";

const routes = [
  {
    path: "/",
    name: "Main",
    component: Main,
    meta: { title: 'Главная - BlackPawnChess.xyz'},
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { title: 'Твой профиль'},
  },
  {
    path: "/test",
    name: "Test",
    component: Test,
  },
  {
    path: "/analysis",
    name: "Analysis",
    component: Analysis,
    meta: { title: 'Анализ партии' },
  },
  {
    path: "/support",
    name: "Support",
    component: SupportPage,
    meta: { title: 'Поддержи проект' },
  },
  {
    path: "/openings",
    name: "Openings",
    component: OpeningDrill,
    meta: { title: 'Тренировка дебютов' },
  },
  {
    path: "/lobby",
    name: "Lobby",
    component: Lobby,
  },
  {
    path: '/puzzles/:id?',
    name: 'puzzle',
    component: () => import('../views/Puzzle.vue'),
    meta: { title: 'Решение задач' },
  },
  {
    path: "/game/bot",
    name: "GameBot",
    component: BotGame,
    meta: { title: 'Игра с ботом' },
  },
  {
    path: "/bot",
    name: "Bot",
    component: HumanityAnalysis,
    meta: { title: 'Анализ человечности игры' },
  },
  {
    path: "/game/:id",
    name: "Game",
    component: Game,
    props: true,
    meta: { title: 'Партия' },
  },
  {
    path: "/watch/:id",
    name: "Watch",
    component: Watch,
    props: true,
  },
  {
    path: "/analysis/:id",
    name: "AnalysisId",
    component: AnalysisId,
    props: true,
    meta: { title: 'Анализ партии' },
  },
  {
    path: "/login",
    component: Login,
    meta: { title: 'Заходи и играй!' },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/ErrorPage.vue"),
    props: {
      code: "404",
      title: "Позиция не найдена",
      message:
        "Этот вариант не предусмотрен теорией. Похоже, вы зашли на несуществующую клетку.",
    },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  document.title = to.meta.title as string || 'BlackPawnChess';

  if (!auth.user) {
    await auth.fetchMe();
  }

  if (to.name === "Profile" && !auth.isAuthenticated) {
    return next("/login");
  }

  next();
});
