<template>
  <div class="app-layout">
    <header class="navbar">
      <router-link to="/" class="navbar-brand">
        <span>Event Booking</span>
      </router-link>

      <nav class="nav-links">
        <router-link to="/" class="nav-link">Events</router-link>
        <router-link to="/venues" class="nav-link">Venues</router-link>
        
        <template v-if="authState.isAuthenticated">
          <router-link to="/bookings" class="nav-link">My Reservations</router-link>
          <router-link to="/events/manage" class="nav-link">Manage Events</router-link>
        </template>
      </nav>

      <div class="auth-controls">
        <template v-if="authState.isAuthenticated">
          <div class="user-info-badge">
            <div class="user-avatar">
              {{ getUserInitials(authState.user) }}
            </div>
            <span class="username">{{ authState.user?.username || 'User' }}</span>
            <span v-if="authState.isAdmin" class="admin-tag">Staff</span>
          </div>
          <button @click="handleLogout" class="btn btn-secondary btn-sm">
            Sign Out
          </button>
        </template>
        
        <template v-else>
          <router-link to="/auth" class="btn btn-primary btn-sm">
            Sign In
          </router-link>
        </template>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>


    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="'toast-' + toast.type"
      >
        <span class="toast-icon">
          <svg v-if="toast.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { authState, logout } from './api';
import { toasts, showToast } from './toast';
import { useRouter } from 'vue-router';

const router = useRouter();

function handleLogout() {
  logout();
  showToast('Logged out successfully.', 'success');
  router.push('/');
}

function getUserInitials(user) {
  if (!user) return 'U';
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.username ? user.username.substring(0, 2).toUpperCase() : 'U';
}
</script>

<style>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
}

.user-info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  padding: 0.35rem 0.75rem 0.35rem 0.35rem;
  border-radius: 9999px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
}

.username {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-tag {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-footer {
  background: #050505;
  border-top: 1px solid var(--border-color);
  padding: 2.5rem 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: auto;
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

@media (min-width: 768px) {
  .footer-content {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}

.footer-brand {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.footer-brand span {
  color: var(--text-primary);
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: var(--transition-smooth);
}

.footer-link:hover {
  color: var(--text-primary);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
