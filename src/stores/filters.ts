import { writable } from 'svelte/store';

export interface FilterState {
  sourceIPs: string[];
  destinationIPs: string[];
  ports: string[];
  protocols: string[];
  services: string[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
}

function createFilterStore() {
  const { subscribe, set, update } = writable<FilterState>({
    sourceIPs: [],
    destinationIPs: [],
    ports: [],
    protocols: [],
    services: [],
    timeRange: {
      start: null,
      end: null
    }
  });

  return {
    subscribe,
    addFilter: (type: keyof Omit<FilterState, 'timeRange'>, value: string) =>
      update(state => ({
        ...state,
        [type]: [...state[type], value]
      })),
    removeFilter: (type: keyof Omit<FilterState, 'timeRange'>, value: string) =>
      update(state => ({
        ...state,
        [type]: state[type].filter(v => v !== value)
      })),
    setTimeRange: (start: Date | null, end: Date | null) =>
      update(state => ({
        ...state,
        timeRange: { start, end }
      })),
    reset: () => set({
      sourceIPs: [],
      destinationIPs: [],
      ports: [],
      protocols: [],
      services: [],
      timeRange: {
        start: null,
        end: null
      }
    })
  };
}

export const filters = createFilterStore(); 