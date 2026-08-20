<template>
  <div class="venues-container container animate-fade-in">
    <div class="venues-layout">
      <div class="venues-list-section">
        <h1 class="gradient-text">Venues Directory</h1>
        <p class="subtitle">Explore registered high-capacity venues available for events.</p>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading venues...</p>
        </div>

        <div v-else-if="venues.length === 0" class="empty-state glass-card mt-3">
          <h3>No Venues Found</h3>
          <p>There are no venues registered in the system yet. {{ authState.isAdmin ? 'Create one now!' : 'Check back later.' }}</p>
        </div>

        <div v-else class="venues-grid mt-3">
          <div v-for="venue in venues" :key="venue.id" class="glass-card venue-card">
            <div class="venue-card-body">
              <div class="venue-header">
                <h3>{{ venue.name }}</h3>
                <span class="capacity-badge">{{ venue.capacity }} seats</span>
              </div>
              <p class="venue-address">{{ venue.address }}</p>
            </div>
            
            <div v-if="authState.isAdmin" class="venue-card-footer">
              <button @click="deleteVenue(venue.id)" class="btn btn-danger btn-sm" :disabled="deleting === venue.id">
                <span v-if="deleting === venue.id">Deleting...</span>
                <span v-else>Delete Venue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="authState.isAdmin" class="admin-panel">
        <div class="glass-card form-card">
          <h3>Register Venue</h3>
          <p class="form-desc">Add a new location to the venue registry.</p>
          <hr class="divider" />

          <form @submit.prevent="createVenue" class="venue-form">
            <div class="form-group">
              <label class="form-label" for="name">Venue Name *</label>
              <input
                type="text"
                id="name"
                v-model="form.name"
                class="form-control"
                placeholder="Grand Ball Room"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="capacity">Maximum Capacity *</label>
              <input
                type="number"
                id="capacity"
                v-model.number="form.capacity"
                class="form-control"
                placeholder="500"
                min="1"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="address">Address / Location *</label>
              <textarea
                id="address"
                v-model="form.address"
                class="form-control"
                rows="3"
                placeholder="123 Elite Plaza, Suite 400..."
                required
              ></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-full mt-2" :disabled="creating">
              <span v-if="creating">Creating...</span>
              <span v-else>Create Venue</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { authState, apiClient } from '../api';
import { showToast } from '../toast';

const venues = ref([]);
const loading = ref(true);
const creating = ref(false);
const deleting = ref(null);

const form = reactive({
  name: '',
  capacity: null,
  address: '',
});

async function loadVenues() {
  loading.value = true;
  try {
    const response = await apiClient.get('venues/');
    venues.value = response.data;
  } catch (error) {
    console.error('Error fetching venues:', error);
    showToast('Failed to load venues directory.', 'error');
  } finally {
    loading.value = false;
  }
}

async function createVenue() {
  creating.value = true;
  try {
    const response = await apiClient.post('venues/', {
      name: form.name,
      capacity: form.capacity,
      address: form.address,
    });
    showToast(`Venue "${response.data.name}" added successfully!`, 'success');
    venues.value.push(response.data);
    
    form.name = '';
    form.capacity = null;
    form.address = '';
  } catch (error) {
    console.error('Error creating venue:', error);
    const errorMsg = error.response?.data?.detail || 
                     (error.response?.data && Object.values(error.response.data).flat().join(' ')) ||
                     'Failed to register venue.';
    showToast(errorMsg, 'error');
  } finally {
    creating.value = false;
  }
}

async function deleteVenue(id) {
  if (!confirm('Are you sure you want to delete this venue? It will remove all associated events.')) {
    return;
  }

  deleting.value = id;
  try {
    await apiClient.delete(`venues/${id}/`);
    showToast('Venue deleted successfully.', 'success');
    venues.value = venues.value.filter((v) => v.id !== id);
  } catch (error) {
    console.error('Error deleting venue:', error);
    showToast('Failed to delete venue. Make sure you have admin rights.', 'error');
  } finally {
    deleting.value = null;
  }
}

onMounted(() => {
  loadVenues();
});
</script>

<style scoped>
.venues-container {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.venues-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 992px) {
  .venues-layout {
    grid-template-columns: v-bind("authState.isAdmin ? '2fr 1fr' : '1fr'");
  }
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.venue-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.venue-card-body {
  padding: 1.5rem;
  flex-grow: 1;
}

.venue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.venue-header h3 {
  font-size: 1.25rem;
  line-height: 1.3;
}

.capacity-badge {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.venue-address {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.venue-card-footer {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  justify-content: flex-end;
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

.venue-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
