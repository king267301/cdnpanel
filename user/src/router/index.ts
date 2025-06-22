import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Domains from '../views/Domains.vue';
import Packages from '../views/Packages.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/domains', component: Domains },
  { path: '/packages', component: Packages },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 