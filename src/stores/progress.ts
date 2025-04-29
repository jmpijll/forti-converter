import { writable } from 'svelte/store';

export interface ProgressState {
  status: 'idle' | 'uploading' | 'processing' | 'generating' | 'complete' | 'error';
  message: string;
  progress: number;
}

function createProgressStore() {
  const { subscribe, set, update } = writable<ProgressState>({
    status: 'idle',
    message: '',
    progress: 0
  });

  return {
    subscribe,
    setStatus: (status: ProgressState['status'], message = '') =>
      update(state => ({ ...state, status, message })),
    setProgress: (progress: number) =>
      update(state => ({ ...state, progress })),
    reset: () => set({
      status: 'idle',
      message: '',
      progress: 0
    })
  };
}

export const progress = createProgressStore(); 