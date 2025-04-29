<script lang="ts">
  import '../app.css';
  import { theme } from '$stores/theme';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  onMount(() => {
    if (browser) {
      // Initialize theme on mount
      document.documentElement.classList.toggle('dark', $theme === 'dark');
    }
  });
</script>

<svelte:head>
  <title>FortiConverter</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <nav class="bg-white dark:bg-gray-800 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            FortiConverter
          </h1>
        </div>
        <div class="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <slot />
  </main>

  <footer class="bg-white dark:bg-gray-800 shadow-sm mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        FortiConverter - Convert FortiAnalyzer logs to FortiGate CLI configurations
      </p>
    </div>
  </footer>
</div> 