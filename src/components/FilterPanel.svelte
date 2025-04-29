<script lang="ts">
  import { filters, type FilterState } from '$stores/filters';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let newFilter = '';
  let selectedFilterType: keyof Omit<FilterState, 'timeRange'> = 'sourceIPs';
  let startDate: string = '';
  let endDate: string = '';

  const filterTypes = ['sourceIPs', 'destinationIPs', 'ports', 'protocols', 'services'] as const;
  type FilterType = typeof filterTypes[number];

  function isFilterType(type: string): type is FilterType {
    return filterTypes.includes(type as FilterType);
  }

  function addFilter() {
    if (newFilter) {
      filters.addFilter(selectedFilterType, newFilter);
      newFilter = '';
      dispatch('filter');
    }
  }

  function removeFilter(type: string, value: string) {
    if (isFilterType(type)) {
      filters.removeFilter(type, value);
      dispatch('filter');
    }
  }

  function updateTimeRange() {
    filters.setTimeRange(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    dispatch('filter');
  }

  function resetFilters() {
    filters.reset();
    startDate = '';
    endDate = '';
    dispatch('filter');
  }

  const filterTypeLabels: Record<FilterType, string> = {
    sourceIPs: 'Source IP',
    destinationIPs: 'Destination IP',
    ports: 'Port',
    protocols: 'Protocol',
    services: 'Service'
  };
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-semibold">Filters</h3>
      <button
        on:click={resetFilters}
        class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        Reset All
      </button>
    </div>
    
    <div class="space-y-6">
      <!-- Filter Input -->
      <div class="flex gap-3">
        <select
          bind:value={selectedFilterType}
          class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
          aria-label="Filter type"
        >
          {#each Object.entries(filterTypeLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>

        <div class="flex-1 relative">
          <input
            type="text"
            bind:value={newFilter}
            placeholder="Add filter value..."
            class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
            aria-label="Filter value"
            on:keydown={e => e.key === 'Enter' && addFilter()}
          />
        </div>

        <button
          on:click={addFilter}
          disabled={!newFilter}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Add
        </button>
      </div>

      <!-- Active Filters -->
      <div class="space-y-4">
        {#each Object.entries($filters) as [type, values]}
          {#if type !== 'timeRange' && values.length > 0 && isFilterType(type)}
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {filterTypeLabels[type]}
              </h4>
              <div class="flex flex-wrap gap-2">
                {#each values as value}
                  <span class="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {value}
                    <button
                      on:click={() => removeFilter(type, value)}
                      class="ml-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
                      aria-label="Remove {value} from {filterTypeLabels[type]}"
                    >
                      ×
                    </button>
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Time Range -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Time Range</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="datetime-local"
              bind:value={startDate}
              on:change={updateTimeRange}
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
            />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="datetime-local"
              bind:value={endDate}
              on:change={updateTimeRange}
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 