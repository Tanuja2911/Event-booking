<template>
  <div class="event-detail-container container animate-fade-in">
    <div class="back-nav mb-2">
      <router-link to="/" class="back-link">
        ← Back to Events
      </router-link>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading event details...</p>
    </div>

    <div v-else-if="event" class="detail-layout">
      <div class="glass-card main-info-card">
        <div class="detail-header">
          <span class="date-badge">{{ formatDate(event.date) }}</span>
          <h1>{{ event.name }}</h1>
          <p class="created-by">Hosted by User #{{ event.created_by }}</p>
        </div>

        <div class="detail-section">
          <h3>About the Event</h3>
          <p class="event-description">{{ event.description }}</p>
        </div>

        <div class="details-grid">
          <div class="detail-info-block">
            <div>
              <h4>Time & Schedule</h4>
              <p>{{ formatTime(event.start_time) }} - {{ formatTime(event.end_time) }}</p>
            </div>
          </div>

          <div class="detail-info-block">
            <div>
              <h4>Venue & Location</h4>
              <p>{{ venue?.name || 'Venue #' + event.venue }}</p>
              <span class="venue-address" v-if="venue?.address">{{ venue.address }}</span>
            </div>
          </div>

          <div class="detail-info-block">
            <div>
              <h4>Venue Capacity</h4>
              <p>{{ venue?.capacity || 'N/A' }} attendees max</p>
            </div>
          </div>
        </div>
      </div>

      <div class="booking-sidebar">
        <div class="glass-card booking-card">
          <h3>Reservation</h3>
          <hr class="divider" />

          <div v-if="activeBooking" class="booking-status-section">
            <div class="status-indicator">
              <span class="status-dot" :class="'dot-' + activeBooking.status"></span>
              <div>
                <p class="status-title">Active Booking Found</p>
                <p class="status-subtitle">Status: <span class="badge" :class="'badge-' + activeBooking.status">{{ activeBooking.status }}</span></p>
              </div>
            </div>
            
            <div class="booking-details-box">
              <p><strong>Booked At:</strong> {{ formatDateTime(activeBooking.booked_at) }}</p>
              <p><strong>Booking ID:</strong> #{{ activeBooking.id }}</p>
            </div>

            <button 
              @click="handleCancelBooking" 
              class="btn btn-danger btn-full mt-2" 
              :disabled="actionLoading"
            >
              <span v-if="actionLoading">Cancelling...</span>
              <span v-else>Cancel Booking</span>
            </button>
          </div>

          <div v-else class="booking-action-section">
            <p class="booking-prompt">
              Reserve your spot at <strong>{{ event.name }}</strong> today. Bookings are processed instantly.
            </p>
            
            <div class="benefit-list">
              <div class="benefit-item">Free cancellation anytime</div>
              <div class="benefit-item">Instant ticket confirmation</div>
              <div class="benefit-item">Notification alerts enabled</div>
            </div>

            <button 
              @click="handleBookEvent" 
              class="btn btn-primary btn-full mt-2" 
              :disabled="actionLoading"
            >
              <span v-if="actionLoading">Booking...</span>
              <span v-else>Book Pass Now</span>
            </button>
          </div>
        </div>

        <div v-if="venue" class="glass-card venue-preview-card mt-2">
          <h4>Venue Details</h4>
          <p class="mt-1"><strong>Name:</strong> {{ venue.name }}</p>
          <p><strong>Address:</strong> {{ venue.address }}</p>
          <p><strong>Max Capacity:</strong> {{ venue.capacity }} seats</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state glass-card">
      <h3>Event Not Found</h3>
      <p>The event you are looking for does not exist or you don't have access permissions.</p>
      <router-link to="/" class="btn btn-primary mt-2">Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '../api';
import { showToast } from '../toast';

const route = useRoute();
const event = ref(null);
const venue = ref(null);
const activeBooking = ref(null);
const loading = ref(true);
const actionLoading = ref(false);

async function loadDetails() {
  loading.value = true;
  const eventId = route.params.id;
  try {
    const eventRes = await apiClient.get(`events/${eventId}/`);
    event.value = eventRes.data;

    if (event.value.venue) {
      try {
        const venueRes = await apiClient.get(`venues/${event.value.venue}/`);
        venue.value = venueRes.data;
      } catch (err) {
        console.error('Error fetching venue:', err);
      }
    }

    await checkUserBooking();
  } catch (error) {
    console.error('Error loading event details:', error);
    showToast('Failed to load event details.', 'error');
  } finally {
    loading.value = false;
  }
}

async function checkUserBooking() {
  const eventId = parseInt(route.params.id);
  try {
    const bookingsRes = await apiClient.get('bookings/');
    const booking = bookingsRes.data.find(
      (b) => b.event === eventId && b.status !== 'cancelled'
    );
    activeBooking.value = booking || null;
  } catch (error) {
    console.error('Error checking bookings:', error);
  }
}

async function handleBookEvent() {
  actionLoading.value = true;
  try {
    const response = await apiClient.post('bookings/', {
      event: event.value.id,
    });
    showToast('Event booked successfully!', 'success');
    activeBooking.value = response.data;
  } catch (error) {
    console.error('Error booking event:', error);
    const errorMsg = error.response?.data?.detail || 
                     (error.response?.data && Object.values(error.response.data).flat().join(' ')) ||
                     'Failed to book event. Please try again.';
    showToast(errorMsg, 'error');
  } finally {
    actionLoading.value = false;
  }
}

async function handleCancelBooking() {
  if (!activeBooking.value) return;
  
  if (!confirm('Are you sure you want to cancel your booking for this event?')) {
    return;
  }

  actionLoading.value = true;
  try {
    await apiClient.post(`bookings/${activeBooking.value.id}/cancel/`);
    showToast('Booking cancelled successfully.', 'success');
    activeBooking.value = null;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to cancel booking.';
    showToast(errorMsg, 'error');
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  loadDetails();
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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
.event-detail-container {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

.back-nav {
  display: flex;
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition-smooth);
}

.back-link:hover {
  color: var(--color-primary);
  transform: translateX(-4px);
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 992px) {
  .detail-layout {
    grid-template-columns: 2fr 1fr;
  }
}

.main-info-card {
  padding: 3rem;
}

.detail-header {
  margin-bottom: 2.5rem;
}

.date-badge {
  background: var(--color-primary);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 1rem;
}

.detail-header h1 {
  font-size: 2.8rem;
  line-height: 1.15;
  margin-bottom: 0.5rem;
}

.created-by {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.detail-section {
  margin-bottom: 2.5rem;
}

.detail-section h3 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
  border-left: 3px solid var(--color-primary);
  padding-left: 0.75rem;
}

.event-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  white-space: pre-line;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
}

.detail-info-block {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.detail-info-block h4 {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-info-block p {
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 500;
}

.secondary-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: block;
  margin-top: 0.25rem;
}

.booking-card {
  padding: 2rem;
}

.booking-card h3 {
  font-size: 1.3rem;
}

.divider {
  border: 0;
  height: 1px;
  background: var(--border-color);
  margin: 1.25rem 0;
}

.booking-prompt {
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.benefit-item {
  font-size: 0.85rem;
  color: var(--status-confirmed);
  font-weight: 500;
}

.booking-status-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-confirmed { background-color: var(--status-confirmed); }
.dot-pending { background-color: var(--status-pending); }
.dot-cancelled { background-color: var(--status-cancelled); }

.status-title {
  font-weight: 600;
  font-size: 1rem;
}

.status-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.booking-details-box {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1rem;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.booking-details-box p {
  color: var(--text-secondary);
}

.booking-details-box strong {
  color: #ffffff;
}

.venue-preview-card {
  padding: 1.5rem;
}

.venue-preview-card h4 {
  font-size: 1.1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.venue-preview-card p {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
