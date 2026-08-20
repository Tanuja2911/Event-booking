<template>
  <div class="auth-container animate-fade-in">
    <div class="glass-card auth-card">
      <div class="auth-header">
        <h2 class="gradient-accent-text">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h2>
        <p>{{ isLogin ? 'Access your dashboard and manage bookings' : 'Join us to start booking premium events' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="form-row">
          <div class="form-group">
            <label class="form-label" for="username">Username *</label>
            <input
              type="text"
              id="username"
              v-model="form.username"
              class="form-control"
              placeholder="johndoe"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Email Address *</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            class="form-control"
            placeholder="name@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password *</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            class="form-control"
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="!isLogin">
          <div class="form-row">
            <div class="form-group half-width">
              <label class="form-label" for="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                v-model="form.first_name"
                class="form-control"
                placeholder="John"
              />
            </div>
            <div class="form-group half-width">
              <label class="form-label" for="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                v-model="form.last_name"
                class="form-control"
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half-width">
              <label class="form-label" for="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                v-model="form.phone"
                class="form-control"
                placeholder="+1234567890"
              />
            </div>
            <div class="form-group half-width">
              <label class="form-label" for="age">Age</label>
              <input
                type="number"
                id="age"
                v-model.number="form.age"
                class="form-control"
                placeholder="25"
                min="0"
              />
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block mt-2" :disabled="submitting">
          <span v-if="submitting">Processing...</span>
          <span v-else>{{ isLogin ? 'Sign In' : 'Register' }}</span>
        </button>
      </form>

      <div class="auth-footer mt-3 text-center">
        <p>
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <a href="#" @click.prevent="toggleMode" class="auth-toggle-link">
            {{ isLogin ? 'Register now' : 'Sign in here' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient, setTokens, fetchProfile } from '../api';
import { showToast } from '../toast';

const router = useRouter();
const route = useRoute();

const isLogin = ref(true);
const submitting = ref(false);

const form = reactive({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  age: null,
});

function toggleMode() {
  isLogin.value = !isLogin.value;
}

async function handleSubmit() {
  submitting.value = true;
  try {
    if (isLogin.value) {
      const response = await apiClient.post('users/login/', {
        email: form.email,
        password: form.password,
      });
      setTokens(response.data.access, response.data.refresh);
      await fetchProfile();
      showToast('Logged in successfully!', 'success');
      
      const redirectTo = route.query.redirect || '/';
      router.push(redirectTo);
    } else {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
      };
      if (form.first_name) payload.first_name = form.first_name;
      if (form.last_name) payload.last_name = form.last_name;
      if (form.phone) payload.phone = form.phone;
      if (form.age !== null) payload.age = form.age;

      await apiClient.post('users/register/', payload);
      showToast('Registration successful! Please sign in.', 'success');
      isLogin.value = true;
      form.password = '';
    }
  } catch (error) {
    console.error('Auth action failed:', error);
    const errorMsg = error.response?.data?.detail || 
                     (error.response?.data && Object.values(error.response.data).flat().join(' ')) ||
                     'Authentication failed. Please verify your credentials.';
    showToast(errorMsg, 'error');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  padding: 3rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.auth-header p {
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.half-width {
  flex: 1;
}

.btn-block {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.05rem;
}

.auth-toggle-link {
  color: var(--color-secondary);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition-smooth);
}

.auth-toggle-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
