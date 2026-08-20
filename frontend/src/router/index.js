import { createRouter, createWebHistory } from 'vue-router';
import { authState, fetchProfile } from '../api';
import EventList from '../views/EventList.vue';
import EventDetail from '../views/EventDetail.vue';
import MyBookings from '../views/MyBookings.vue';
import VenueList from '../views/VenueList.vue';
import ManageEvents from '../views/ManageEvents.vue';
import Auth from '../views/Auth.vue';

const routes = [
  {
    path: '/',
    name: 'Events',
    component: EventList,
  },
  {
    path: '/events/:id',
    name: 'EventDetail',
    component: EventDetail,
    meta: { requiresAuth: true },
  },
  {
    path: '/bookings',
    name: 'Bookings',
    component: MyBookings,
    meta: { requiresAuth: true },
  },
  {
    path: '/venues',
    name: 'Venues',
    component: VenueList,
  },
  {
    path: '/events/manage',
    name: 'ManageEvents',
    component: ManageEvents,
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active-link',
});
router.beforeEach(async (to, from, next) => {
  if (authState.loading && authState.isAuthenticated) {
    try {
      await fetchProfile();
    } catch (e) {
      console.error('Error fetching profile in guard:', e);
    }
  }

  const isAuthenticated = authState.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Auth', query: { redirect: to.fullPath } });
  } else if (to.name === 'Auth' && isAuthenticated) {
    next({ name: 'Events' });
  } else {
    next();
  }
});

export default router;
