import { reactive } from 'vue';

export const toasts = reactive([]);

export function showToast(message, type = 'success', duration = 3000) {
  const id = Date.now() + Math.random().toString(36).substring(2, 9);
  const toast = { id, message, type };
  toasts.push(toast);

  setTimeout(() => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  }, duration);
}
