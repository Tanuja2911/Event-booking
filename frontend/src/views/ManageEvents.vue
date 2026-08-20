<template>
  <div class="manage-events-container container animate-fade-in">
    <div class="layout-grid">
      <div class="events-list-section">
        <h1 class="gradient-text">Manage My Events</h1>
        <p class="subtitle">Edit, monitor, or remove events you have created.</p>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading your hosted events...</p>
        </div>

        <div v-else-if="myEvents.length === 0" class="empty-state glass-card mt-3">
          <h3>No Hosted Events</h3>
          <p>You haven't created any events yet. Fill out the registration form to host your first event!</p>
        </div>

        <div v-else class="events-list mt-3">
          <div v-for="event in myEvents" :key="event.id" class="glass-card event-row-card">
            <div class="event-row-body">
              <div class="event-row-header">
                <h3>{{ event.name }}</h3>
                <span class="event-date">{{ formatDate(event.date) }}</span>
              </div>
              <p class="event-desc">{{ truncateText(event.description, 150) }}</p>
              
              <div class="event-meta-info">
                <span class="meta-item">Venue: {{ getVenueName(event.venue) }}</span>
                <span class="meta-item">Time: {{ formatTime(event.start_time) }} - {{ formatTime(event.end_time) }}</span>
              </div>
            </div>
            
            <div class="event-row-actions">
              <router-link :to="'/events/' + event.id" class="btn btn-secondary btn-sm">
                View Pass
              </router-link>
              <button 
                @click="deleteEvent(event.id)" 
                class="btn btn-danger btn-sm"
                :disabled="deleting === event.id"
              >
                <span v-if="deleting === event.id">Deleting...</span>
                <span v-else>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="host-event-section">
        <div class="glass-card form-card">
          <h3>Host New Event</h3>
          <p class="form-desc">Register a public or private event at a registered venue.</p>
          <hr class="divider" />

          <div v-if="venues.length === 0 && !loading" class="no-venues-warning">
            <p>No venues are registered yet. You must create or select a venue before hosting an event.</p>
            <router-link to="/venues" class="btn btn-secondary btn-sm mt-1">Go to Venues Directory</router-link>
          </div>

          <form v-else @submit.prevent="createEvent" class="event-form">
            <div class="form-group">
              <label class="form-label" for="name">Event Name *</label>
              <input
                type="text"
                id="name"
                v-model="form.name"
                class="form-control"
                placeholder="Product Launch Keynote"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="venue">Select Venue *</label>
              <select id="venue" v-model="form.venue" class="form-control" required>
                <option value="" disabled selected>Choose a location...</option>
                <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                  {{ venue.name }} (Capacity: {{ venue.capacity }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="date">Event Date *</label>
              <input
                type="date"
                id="date"
                v-model="form.date"
                class="form-control"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label class="form-label" for="start_time">Start Time *</label>
                <input
                  type="time"
                  id="start_time"
                  v-model="form.start_time"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group half-width">
                <label class="form-label" for="end_time">End Time *</label>
                <input
                  type="time"
                  id="end_time"
                  v-model="form.end_time"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Event Description *</label>
              <textarea
                id="description"
                v-model="form.description"
                class="form-control"
                rows="4"
                placeholder="Detail what attendees can expect, agenda items, etc..."
                required
              ></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-full mt-2" :disabled="creating">
              <span v-if="creating">Creating event...</span>
              <span v-else>Launch Event</span>
            </button>
          </form>
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
const loading = ref(true);
const creating = ref(false);
const deleting = ref(null);

const form = reactive({
  name: '',
  venue: '',
  date: '',
  start_time: '',
  end_time: '',
  description: '',
});

const myEvents = computed(() => {
  if (!authState.user) return [];
  return events.value.filter((event) => event.created_by === authState.user.id);
});

async function loadData() {
  loading.value = true;
  try {
    const [eventsRes, venuesRes] = await Promise.all([
      apiClient.get('events/'),
      apiClient.get('venues/'),
    ]);
    events.value = eventsRes.data;
    venues.value = venuesRes.data;
  } catch (error) {
    console.error('Error fetching manage-events data:', error);
    showToast('Failed to load events or venues.', 'error');
  } finally {
    loading.value = false;
  }
}

async function createEvent() {
  creating.value = true;
  try {
    const payload = {
      name: form.name,
      venue: parseInt(form.venue),
      date: form.date,
      start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
      end_time: form.end_time.length === 5 ? `${form.end_time}:00` : form.end_time,
      description: form.description,
    };

    const response = await apiClient.post('events/', payload);
    showToast(`Event "${response.data.name}" hosted successfully!`, 'success');
    events.value.push(response.data);

    form.name = '';
    form.venue = '';
    form.date = '';
    form.start_time = '';
    form.end_time = '';
    form.description = '';
  } catch (error) {
    console.error('Error creating event:', error);
    const errorMsg = error.response?.data?.non_field_errors?.[0] ||
                     error.response?.data?.detail ||
                     (error.response?.data && Object.values(error.response.data).flat().join(' ')) ||
                     'Failed to create event. Double check schedule overlaps.';
    showToast(errorMsg, 'error');
  } finally {
    creating.value = false;
  }
}

async function deleteEvent(id) {
  if (!confirm('Are you sure you want to delete this event? This will also cancel all registrations.')) {
    return;
  }

  deleting.value = id;
  try {
    await apiClient.delete(`events/${id}/`);
    showToast('Event deleted successfully.', 'success');
    events.value = events.value.filter((e) => e.id !== id);
  } catch (error) {
    console.error('Error deleting event:', error);
    showToast('Failed to delete event. Make sure you are the host.', 'error');
  } finally {
    deleting.value = null;
  }
}

onMounted(() => {
  loadData();
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
.manage-events-container {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 992px) {
  .layout-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.event-row-card {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 576px) {
  .event-row-card {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.event-row-body {
  flex-grow: 1;
}

.event-row-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.event-row-header h3 {
  font-size: 1.3rem;
}

.event-date {
  background: var(--color-primary);
  color: #ffffff;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.event-desc {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.event-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.event-row-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.form-card {
  padding: 2rem;
  position: sticky;
  top: 100px;
}

.form-card h3 {
  font-size: 1.3rem;
}

.form-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.divider {
  border: 0;
  height: 1px;
  background: var(--border-color);
  margin: 1.25rem 0;
}

.no-venues-warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #fbbf24;
  line-height: 1.5;
}

.event-form {
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

.btn-full {
  width: 100%;
  justify-content: center;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
