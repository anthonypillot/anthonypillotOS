import { type Ref, onMounted, onUnmounted } from 'vue';

export function useClickOutside(elementRef: Ref<HTMLElement | null>, callback: (event: Event) => void) {
  if (!import.meta.client) return;
  
  const listener = (event: Event) => {
    if (!elementRef.value || elementRef.value.contains(event.target as Node)) {
      return;
    }
    callback(event);
  };

  onMounted(() => {
    document.addEventListener('mousedown', listener);
  });

  onUnmounted(() => {
    document.removeEventListener('mousedown', listener);
  });

  return {
    listener
  };
}