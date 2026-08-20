<template>
  <div class="event-list-container">
    <div v-if="!authState.isAuthenticated" class="landing-hero animate-fade-in">
      <div class="hero">
        <div class="tagline">DISCOVER & BOOK PREMIUM EXPERIENCES</div>
        <h1 class="hero-title">Elevate Your Events with <span class="gradient-accent-text">Event Booking</span></h1>
        <p class="hero-subtitle">
          Join the exclusive platform for discovering elite venues, hosting bespoke events, and booking seamless passes. All in one fluid experience.
        </p>
        <div class="hero-actions">
          <router-link to="/auth" class="btn btn-primary btn-lg">Get Started</router-link>
          <router-link to="/venues" class="btn btn-secondary btn-lg">Explore Venues</router-link>
        </div>
      </div>

      <div class="features-grid container">
        <div class="glass-card feature-card">
          <h3>Curated Events</h3>
          <p>Explore exclusive, premium events curated by top organizers worldwide.</p>
        </div>
        <div class="glass-card feature-card">
          <h3>Elite Venues</h3>
          <p>Access high-capacity luxury spaces suited for any occasion.</p>
        </div>
        <div class="glass-card feature-card">
          <h3>Instant Booking</h3>
          <p>Secure your pass instantly with live status tracking and notifications.</p>
        </div>
      </div>
    </div>

    <div v-else class="explorer-view animate-fade-in container">
      <div class="explorer-header">
        <div>
          <h1 class="gradient-text">Explore Events</h1>
          <p>Discover what's happening or create your own events.</p>
        </div>
        <router-link to="/events/manage" class="btn btn-primary">
          <span>+ Create Event</span>
        </router-link>
      </div>

      <div class="glass-card filters-bar mt-2">
        <div class="filter-group search-box">
          <label class="filter-label">Search Events</label>
          <input
            type="text"
            v-model="filters.search"
            class="form-control"
            placeholder="Search by name or description..."
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">Filter by Venue</label>
          <select v-model="filters.venue" class="form-control">
            <option value="">All Venues</option>
            <option v-for="venue in venues" :key="venue.id" :value="venue.id">
              {{ venue.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Date</label>
          <input type="date" v-model="filters.date" class="form-control" />
        </div>

        <div class="filter-group clear-btn-group">
          <button @click="clearFilters" class="btn btn-secondary btn-sm" :disabled="!hasActiveFilters">
            Clear Filters
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching amazing events for you...</p>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="empty-state glass-card mt-3">
        <h3>No Events Found</h3>
        <p>We couldn't find any events matching your search criteria. Try adjusting your filters or create a new event!</p>
        <button @click="clearFilters" class="btn btn-primary mt-2" v-if="hasActiveFilters">Reset Filters</button>
      </div>

      <div v-else class="grid-cols-3 mt-3">
        <div v-for="event in filteredEvents" :key="event.id" class="glass-card event-card">
          <div class="event-card-header">
            <span class="event-date-badge">
              {{ formatDate(event.date) }}
            </span>
          </div>
          <div class="event-card-body">
            <h3>{{ event.name }}</h3>
            <p class="event-desc">{{ truncateText(event.description, 100) }}</p>
            
            <div class="event-meta-info">
              <div class="meta-item">
                <span class="meta-text">Venue: {{ getVenueName(event.venue) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-text">Time: {{ formatTime(event.start_time) }} - {{ formatTime(event.end_time) }}</span>
              </div>
            </div>
          </div>
          <div class="event-card-footer">
            <router-link :to="'/events/' + event.id" class="btn btn-secondary btn-sm btn-full">
              View & Book Details →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { authState, apiClient } from '../api';
import { showToast } from '../toast';

const events = ref([]);
const venues = ref([]);
const loading = ref(false);

const filters = reactive({
  search: '',
  venue: '',
  date: '',
});

const hasActiveFilters = computed(() => {
  return filters.search || filters.venue || filters.date;
});

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = event.name.toLowerCase().includes(q);
      const matchDesc = event.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    if (filters.venue && event.venue !== parseInt(filters.venue)) {
      return false;
    }
    if (filters.date && event.date !== filters.date) {
      return false;
    }
    return true;
  });
});

function clearFilters() {
  filters.search = '';
  filters.venue = '';
  filters.date = '';
}

async function loadData() {
  if (!authState.isAuthenticated) return;
  
  loading.value = true;
  try {
    const [eventsRes, venuesRes] = await Promise.all([
      apiClient.get('events/'),
      apiClient.get('venues/'),
    ]);
    events.value = eventsRes.data;
    venues.value = venuesRes.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    showToast('Failed to load events. Please try again.', 'error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!authState.isAuthenticated) {
    apiClient.get('venues/')
      .then((res) => { venues.value = res.data; })
      .catch((err) => console.error('Error loading public venues:', err));
  } else {
    loadData();
  }
});

function getVenueName(venueId) {
  const v = venues.value.find((venue) => venue.id === venueId);
  return v ? v.name : `Venue #${venueId}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function truncateText(text, limit) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}
</script>

<style scoped>
.event-list-container {
  min-height: calc(100vh - 120px);
}

.landing-hero {
  position: relative;
  overflow: hidden;
  padding: 6rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.tagline {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--color-secondary);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  max-width: 800px;
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.15rem;
  max-width: 650px;
  margin-bottom: 3rem;
  color: var(--text-secondary);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 4rem;
}

.btn-lg {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  width: 100%;
}

.feature-card {
  padding: 2rem 1.5rem;
  text-align: left;
}

.feature-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.explorer-view {
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.explorer-header h1 {
  font-size: 2rem;
}

.filters-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-box {
  grid-column: span 1;
}

@media (min-width: 768px) {
  .search-box {
    grid-column: span 2;
  }
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.clear-btn-group {
  justify-content: flex-end;
  height: 38px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state h3 {
  font-size: 1.25rem;
}

.empty-state p {
  max-width: 450px;
  color: var(--text-secondary);
}

.event-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.event-card-header {
  padding: 1.5rem 1.5rem 0.5rem;
}

.event-date-badge {
  background: var(--color-primary);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.event-card-body {
  padding: 1rem 1.5rem 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-card-body h3 {
  font-size: 1.25rem;
  line-height: 1.3;
  margin-bottom: 0.25rem;
}

.event-desc {
  font-size: 0.95rem;
  margin-bottom: auto;
  overflow: hidden;
  color: var(--text-secondary);
}

.event-meta-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.event-card-footer {
  padding: 0 1.5rem 1.5rem;
}

.btn-full {
  width: 100%;
  justify-content: center;
}
</style>
