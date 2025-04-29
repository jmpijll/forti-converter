<!-- ErrorPopup.svelte -->
<script lang="ts">
  export let message: string;
  export let details: string = '';
  export let onClose: () => void;
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
    <div class="p-6">
      <div class="flex justify-between items-start">
        <h3 class="text-xl font-semibold text-red-600 dark:text-red-400">Error</h3>
        <button
          on:click={onClose}
          class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="mt-4">
        <p class="text-gray-900 dark:text-gray-100 font-medium">{message}</p>
        {#if details}
          <pre class="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{details}</pre>
        {/if}
      </div>
      <div class="mt-6 flex justify-end">
        <button
          on:click={onClose}
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div> 