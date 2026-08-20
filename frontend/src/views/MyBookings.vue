<template>
  <div class="bookings-container container animate-fade-in">
    <div class="bookings-header">
      <h1 class="gradient-text">My Reservations</h1>
      <p>Manage your booked passes and reservations below.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching your reservations...</p>
    </div>

    <div v-else-if="mappedBookings.length === 0" class="empty-state glass-card mt-3">
      <h3>No Bookings Found</h3>
      <p>You haven't booked any event passes yet. Browse upcoming events and secure your spot!</p>
      <router-link to="/" class="btn btn-primary mt-2">Browse Events</router-link>
    </div>

    <div v-else class="bookings-content mt-3">
      <div class="glass-card table-container">
        <table class="bookings-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Event Info</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Booked On</th>
              <th>Status</th>
              <th class="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in mappedBookings" :key="booking.id" class="booking-row">
              <td class="booking-id">#{{ booking.id }}</td>
              <td class="booking-event">
                <span class="event-name-link" @click="goToEvent(booking.event)">
                  {{ booking.eventName }}
                </span>
              </td>
              <td class="booking-time">
                <div class="date-text">{{ formatDate(booking.eventDate) }}</div>
                <div class="time-text">{{ formatTime(booking.eventStart) }}</div>
              </td>
              <td class="booking-venue">{{ booking.venueName }}</td>
              <td class="booking-date">{{ formatDateTime(booking.booked_at) }}</td>
              <td>
                <span class="badge" :class="'badge-' + booking.status">{{ booking.status }}</span>
              </td>
              <td class="booking-actions">
                <button
                  v-if="booking.status !== 'cancelled'"
                  @click="cancelBooking(booking.id)"
                  class="btn btn-danger btn-sm"
                  :disabled="actionLoading === booking.id"
                >
                  <span v-if="actionLoading === booking.id">Cancelling...</span>
                  <span v-else>Cancel Pass</span>
                </button>
                <span v-else class="cancelled-text">No actions</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api';
import { showToast } from '../toast';

const router = useRouter();
const bookings = ref([]);
const events = ref([]);
const venues = ref([]);
const loading = ref(true);
const actionLoading = ref(null);

async function loadData() {
  loading.value = true;
  try {
    const [bookingsRes, eventsRes, venuesRes] = await Promise.all([
      apiClient.get('bookings/'),
      apiClient.get('events/'),
      apiClient.get('venues/'),
    ]);
    bookings.value = bookingsRes.data;
    events.value = eventsRes.data;
    venues.value = venuesRes.data;
  } catch (error) {
    console.error('Error fetching bookings data:', error);
    showToast('Failed to load reservation data.', 'error');
  } finally {
    loading.value = false;
  }
}

const mappedBookings = computed(() => {
  return bookings.value.map((booking) => {
    const event = events.value.find((e) => e.id === booking.event);
    const venue = event ? venues.value.find((v) => v.id === event.venue) : null;

    return {
      ...booking,
      eventName: event ? event.name : `Event #${booking.event}`,
      eventDate: event ? event.date : null,
      eventStart: event ? event.start_time : null,
      venueName: venue ? venue.name : (event ? `Venue #${event.venue}` : 'Unknown Venue'),
    };
  }).sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));
});

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  actionLoading.value = bookingId;
  try {
    await apiClient.post(`bookings/${bookingId}/cancel/`);
    showToast('Pass cancelled successfully.', 'success');
    
    const booking = bookings.value.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = 'cancelled';
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to cancel reservation.';
    showToast(errorMsg, 'error');
  } finally {
    actionLoading.value = null;
  }
}

function goToEvent(eventId) {
  router.push({ name: 'EventDetail', params: { id: eventId } });
}

onMounted(() => {
  loadData();
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
</script>

<style scoped>
.bookings-container {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.bookings-header {
  margin-bottom: 2.5rem;
}

.bookings-header h1 {
  font-size: 2.5rem;
}

.table-container {
  overflow-x: auto;
  border-radius: 16px;
  background: var(--bg-card);
}

.bookings-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 800px;
}

.bookings-table th {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-color);
  padding: 1.25rem 1.5rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bookings-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.95rem;
  vertical-align: middle;
}

.booking-row {
  transition: var(--transition-smooth);
}

.booking-row:hover {
  background: rgba(255, 255, 255, 0.01);
}

.booking-id {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-secondary);
}

.booking-event {
  font-weight: 600;
}

.event-name-link {
  cursor: pointer;
  color: #ffffff;
  transition: var(--transition-smooth);
}

.event-name-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.booking-time .date-text {
  font-weight: 500;
}

.booking-time .time-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.booking-venue {
  color: var(--text-secondary);
}

.booking-date {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.actions-header, .booking-actions {
  text-align: right;
}

.cancelled-text {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
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
