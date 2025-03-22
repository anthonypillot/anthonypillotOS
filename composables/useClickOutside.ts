import { onMounted, onUnmounted } from 'vue';

export function useClickOutside(elementRef: any, callback: Function) {
  if (!process.client) return;
  
  const listener = (event: Event) => {
    if (!elementRef.value || elementRef.value.contains(event.target)) {
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