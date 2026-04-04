import { createRouter, createWebHistory } from "vue-router";

import HomeView from "./views/HomeView.vue";
import PlayView from "./views/PlayView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },
    {
      path: "/play/:slug",
      name: "play",
      component: PlayView,
      props: true
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;

