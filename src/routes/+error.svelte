<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 text-center">
    <div>
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
        {$page.status}: {$page.error?.message || 'Something went wrong'}
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {#if $page.status === 404}
          The page you're looking for doesn't exist.
        {:else if $page.status === 500}
          An internal server error occurred. Please try again later.
        {:else}
          An unexpected error occurred. Please try again later.
        {/if}
      </p>
    </div>
    <div>
      <a
        href="/"
        class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Go back home
      </a>
    </div>
  </div>
</div> 