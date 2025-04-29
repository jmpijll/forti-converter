<script lang="ts">
  import { progress } from '$stores/progress';

  const statusColors = {
    idle: 'bg-gray-200 dark:bg-gray-700',
    uploading: 'bg-blue-500',
    processing: 'bg-blue-500',
    generating: 'bg-blue-500',
    complete: 'bg-green-500',
    error: 'bg-red-500'
  };
</script>

<div class="space-y-2">
  <div class="flex justify-between items-center">
    <div class="flex items-center space-x-2">
      {#if $progress.status === 'error'}
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {:else if $progress.status === 'complete'}
        <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {:else if $progress.status !== 'idle'}
        <svg class="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      {/if}
      <span class="text-sm font-medium">{$progress.message}</span>
    </div>
    {#if $progress.status !== 'idle' && $progress.status !== 'error'}
      <span class="text-sm font-medium">{$progress.progress}%</span>
    {/if}
  </div>
  
  <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
    <div
      class="h-full transition-all duration-300 ease-out {statusColors[$progress.status]}"
      style="width: {$progress.progress}%"
    />
  </div>
</div> 