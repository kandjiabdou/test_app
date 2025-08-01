import { createRouter, createWebHistory } from 'vue-router'
import OpenFluxView from '../views/OpenFluxView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  {
    path: "/",
    name: "home",
    component: OpenFluxView,
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: {
      title: "Panneau d'administration",
      requiresAdmin: true, // Si vous voulez ajouter une protection admin plus tard
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 