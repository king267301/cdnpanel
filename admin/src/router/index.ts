import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Users from '../views/Users.vue';
import Payment from '../views/Payment.vue';
import Security from '../views/Security.vue';
import Domains from '../views/Domains.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/users', component: Users },
  { path: '/payment', component: Payment },
  { path: '/security', component: Security },
  { path: '/domains', component: Domains },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 