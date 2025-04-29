<script lang="ts">
  import { onMount } from 'svelte';
  import { LogProcessor } from '$lib/processors/LogProcessor';
  import { CLIGenerator } from '$lib/generators/CLIGenerator';
  import { progress } from '$stores/progress';
  import { filters } from '$stores/filters';
  import FilterPanel from '$components/FilterPanel.svelte';
  import ProgressBar from '$components/ProgressBar.svelte';
  import ErrorPopup from '$components/ErrorPopup.svelte';
  import type { ProcessedEntry } from '$lib/processors/LogProcessor';

  let fileInput: HTMLInputElement;
  let isProcessing = false;
  let currentProgress = 0;
  let status = '';
  let cliScriptAddresses = '';
  let cliScriptServices = '';
  let cliScriptPolicies = '';
  let error = '';
  let errorDetails = '';
  let showErrorPopup = false;
  let results: ProcessedEntry[] = [];
  let filteredResults: ProcessedEntry[] = [];
  let showAdvanced = false;
  let showExplanation = false;
  let processor: LogProcessor;
  let totalFiles = 0;
  let processedFiles = 0;

  // Naming convention settings
  let namingSettings = {
    addressPrefix: 'ADDR_',
    servicePrefix: 'SVC_',
    policyPrefix: 'POLICY_',
    useUnderscores: true,
    includePort: true,
    excludePublicIPs: false
  };

  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 10;
  let itemsPerPageOptions = [10, 25, 50, 100];
  
  // Constants for file processing
  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB limit per file
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks for processing
  const MAX_LINES_IN_MEMORY = 10000; // Reduced to 10k lines at a time
  
  $: {
    // Filter results whenever excludePublicIPs changes or results change
    filteredResults = results.filter(entry => {
      if (namingSettings.excludePublicIPs) {
        // Keep entry only if destination is private and at least one source is private
        const hasPrivateSource = entry.sources.some(src => isPrivateIP(src));
        return isPrivateIP(entry.destination.ip) && hasPrivateSource;
      }
      return true;
    }).map(entry => {
      if (namingSettings.excludePublicIPs) {
        // Filter out public source IPs if excludePublicIPs is true
        return {
          ...entry,
          sources: entry.sources.filter(src => isPrivateIP(src))
        };
      }
      return entry;
    });
  }

  $: totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  $: paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function changePage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }

  onMount(() => {
    processor = new LogProcessor(true, 1024 * 1024 * 5); // 5MB chunks
  });

  function formatName(name: string, useUnderscores: boolean): string {
    if (useUnderscores) {
      return name.replace(/\./g, '_');
    }
    return name.replace(/\./g, '-');
  }

  function isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    return (
      (parts[0] === 10) || // 10.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) // 192.168.0.0/16
    );
  }

  function generateScripts(entries: ProcessedEntry[]) {
    // Track unique entries
    const uniqueAddresses = new Map<string, string>();
    const uniqueServices = new Map<string, string>();
    const uniquePolicies = new Map<string, Set<string>>();

    // First pass: collect all unique entries and group sources by destination:port
    entries.forEach(entry => {
      const addressName = `${namingSettings.addressPrefix}${formatName(entry.destination.ip, namingSettings.useUnderscores)}`;
      const serviceName = namingSettings.includePort
        ? `${namingSettings.servicePrefix}${entry.service}_${entry.destination.port}`
        : `${namingSettings.servicePrefix}${entry.service}`;

      // Add destination address
      if (!uniqueAddresses.has(entry.destination.ip)) {
        uniqueAddresses.set(entry.destination.ip, `config firewall address
    edit "${addressName}"
        set subnet ${entry.destination.ip}/32
        set comment "Generated from FortiAnalyzer logs"
        set color 1
    next`);
      }

      // Add source addresses
      entry.sources.forEach(src => {
        const srcAddressName = `${namingSettings.addressPrefix}${formatName(src, namingSettings.useUnderscores)}`;
        if (!uniqueAddresses.has(src)) {
          uniqueAddresses.set(src, `config firewall address
    edit "${srcAddressName}"
        set subnet ${src}/32
        set comment "Generated from FortiAnalyzer logs"
        set color 1
    next`);
        }
      });

      // Add service
      const serviceKey = `${entry.service}:${entry.destination.port}`;
      if (!uniqueServices.has(serviceKey)) {
        uniqueServices.set(serviceKey, `config firewall service custom
    edit "${serviceName}"
        set tcp-portrange ${entry.destination.port}
        set comment "Generated from FortiAnalyzer logs"
    next`);
      }

      // Group sources by destination:port combination
      const policyKey = `${entry.destination.ip}:${entry.destination.port}`;
      if (!uniquePolicies.has(policyKey)) {
        uniquePolicies.set(policyKey, new Set<string>());
      }
      
      // Add sources to the policy
      entry.sources.forEach(src => {
        uniquePolicies.get(policyKey)?.add(src);
      });
    });

    // Generate final scripts with unique entries only
    cliScriptAddresses = Array.from(uniqueAddresses.values()).join('\nend\n\n') + '\nend';
    cliScriptServices = Array.from(uniqueServices.values()).join('\nend\n\n') + '\nend';

    // Generate policies with grouped sources
    cliScriptPolicies = Array.from(uniquePolicies.entries()).map(([key, sources]) => {
      const [dstIP, dstPort] = key.split(':');
      const addressName = `${namingSettings.addressPrefix}${formatName(dstIP, namingSettings.useUnderscores)}`;
      const serviceName = namingSettings.includePort
        ? `${namingSettings.servicePrefix}any_${dstPort}`
        : `${namingSettings.servicePrefix}any`;
      const policyName = `${namingSettings.policyPrefix}${formatName(dstIP, namingSettings.useUnderscores)}_${dstPort}`;

      return `config firewall policy
    edit 0
        set name "${policyName}"
        set srcintf "any"
        set dstintf "any"
        set srcaddr "${Array.from(sources).map(src => `${namingSettings.addressPrefix}${formatName(src, namingSettings.useUnderscores)}`).join('" "')}"
        set dstaddr "${addressName}"
        set service "${serviceName}"
        set action accept
        set schedule "always"
        set status enable
    next`;
    }).join('\nend\n\n') + '\nend';
  }

  function handleNamingChange() {
    if (filteredResults.length > 0) {
      generateScripts(filteredResults);
    }
  }

  $: if (filteredResults.length > 0) {
    generateScripts(filteredResults);
  }

  function downloadScript(scriptContent: string, filename: string) {
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showError(message: string, details: string = '') {
    error = message;
    errorDetails = details;
    showErrorPopup = true;
    isProcessing = false;
    currentProgress = 0;
    progress.setStatus('error', message);
  }

  function closeError() {
    showErrorPopup = false;
    error = '';
    errorDetails = '';
  }

  async function processFileInChunks(file: File) {
    const reader = new FileReader();
    let offset = 0;
    let lastPartialLine = '';
    let processedLines: string[] = [];
    
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsText(slice);
    };

    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          if (e.target?.result) {
            const chunk = e.target.result as string;
            const lines = (lastPartialLine + chunk).split('\n');
            lastPartialLine = lines.pop() || '';

            processedLines.push(...lines);

            // Process lines in smaller batches to avoid memory issues
            while (processedLines.length >= MAX_LINES_IN_MEMORY) {
              try {
                const currentBatch = processedLines.splice(0, MAX_LINES_IN_MEMORY).join('\n');
                const batchResults = await processor.processFile(currentBatch);
                results = [...results, ...batchResults];
                
                // Force garbage collection hint
                processedLines = processedLines.filter(Boolean);
                
                // Update progress more frequently
                const progress = Math.min((offset / file.size) * 100, 99);
                currentProgress = progress;
                
              } catch (err) {
                reject(err);
                return;
              }
            }

            offset += CHUNK_SIZE;

            if (offset < file.size) {
              // Small delay to allow UI updates and garbage collection
              await new Promise(resolve => setTimeout(resolve, 0));
              readNextChunk();
            } else {
              // Process remaining lines
              if (processedLines.length > 0 || lastPartialLine) {
                try {
                  if (lastPartialLine) {
                    processedLines.push(lastPartialLine);
                  }
                  
                  // Process remaining lines in smaller batches
                  while (processedLines.length > 0) {
                    const batchSize = Math.min(processedLines.length, MAX_LINES_IN_MEMORY);
                    const currentBatch = processedLines.splice(0, batchSize).join('\n');
                    const batchResults = await processor.processFile(currentBatch);
                    results = [...results, ...batchResults];
                    
                    // Force garbage collection hint
                    processedLines = processedLines.filter(Boolean);
                    
                    // Small delay between batches
                    await new Promise(resolve => setTimeout(resolve, 0));
                  }
                } catch (err) {
                  reject(err);
                  return;
                }
              }
              
              resolve(results);
            }
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      readNextChunk();
    });
  }
  
  async function handleFileUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) {
      showError('Please select at least one file');
      return;
    }

    // Convert FileList to array for easier handling
    const fileArray = Array.from(files);
    totalFiles = fileArray.length;
    processedFiles = 0;

    // Validate all files first
    for (const file of fileArray) {
      if (file.size === 0) {
        showError('One of the selected files is empty');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showError(
          'File is too large',
          `Maximum file size is 2GB per file. File "${file.name}" size: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`
        );
        return;
      }
    }

    isProcessing = true;
    currentProgress = 0;
    status = 'Processing files...';
    error = '';
    results = [];
    progress.reset();
    progress.setStatus('uploading');
    
    try {
      // Process each file sequentially
      for (const file of fileArray) {
        status = `Processing file ${processedFiles + 1} of ${totalFiles}: ${file.name}`;
        
        let fileResults: ProcessedEntry[];
        if (file.size > CHUNK_SIZE) {
          fileResults = await processFileInChunks(file) as ProcessedEntry[];
        } else {
          const fileContent = await file.text();
          fileResults = await processor.processFile(fileContent);
        }

        // Merge results, maintaining unique combinations
        results = processor.mergeResults(results, fileResults);
        
        processedFiles++;
        currentProgress = (processedFiles / totalFiles) * 100;
      }
      
      if (results.length === 0) {
        showError('No valid entries found in any of the files', 'The files may be empty or not in the expected format');
        return;
      }

      status = 'Processing complete';
      progress.setStatus('complete', 'Processing complete');
      progress.setProgress(100);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      const errorStack = e instanceof Error ? e.stack : '';
      showError('Error processing files', `${errorMessage}\n\n${errorStack}`);
    } finally {
      isProcessing = false;
      currentProgress = 100;
    }
  }

  function handleFilter() {
    if (results.length) {
      handleFileUpload({ target: fileInput } as unknown as Event);
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="flex justify-between items-start mb-8">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Fortinet Log Converter</h1>
      <button
        on:click={() => showExplanation = !showExplanation}
        class="mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary flex items-center"
      >
        <span class="mr-1">{showExplanation ? 'Hide' : 'Show'} explanation</span>
        <svg
          class="w-4 h-4 transform transition-transform {showExplanation ? 'rotate-180' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
    <button
      on:click={() => showAdvanced = !showAdvanced}
      class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
    >
      {showAdvanced ? 'Simple Mode' : 'Advanced Mode'}
    </button>
  </div>

  {#if showExplanation}
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 animate-fade-in">
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-lg font-semibold mb-3">About FortiConverter</h2>
        <p class="mb-4">
          FortiConverter helps you convert FortiAnalyzer traffic logs into FortiGate CLI configuration scripts.
          It processes your CSV logs and generates three types of configurations:
        </p>
        <ul class="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Address Objects:</strong> Creates network address objects for all unique IPs</li>
          <li><strong>Service Objects:</strong> Defines custom services based on port usage</li>
          <li><strong>Firewall Policies:</strong> Generates policies grouped by destination IP and port</li>
        </ul>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-2"><strong>Features:</strong></p>
          <ul class="list-none grid grid-cols-2 gap-2">
            <li>✓ Large file support (>2GB)</li>
            <li>✓ Public/Private IP filtering</li>
            <li>✓ Custom naming conventions</li>
            <li>✓ Batch processing</li>
            <li>✓ Real-time preview</li>
            <li>✓ Dark/Light mode</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}

  {#if showAdvanced}
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Naming Convention Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <label class="block">
          <span class="text-gray-700 dark:text-gray-300">Address Prefix</span>
          <input
            type="text"
            bind:value={namingSettings.addressPrefix}
            on:input={handleNamingChange}
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </label>
        
        <label class="block">
          <span class="text-gray-700 dark:text-gray-300">Service Prefix</span>
          <input
            type="text"
            bind:value={namingSettings.servicePrefix}
            on:input={handleNamingChange}
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </label>
        
        <label class="block">
          <span class="text-gray-700 dark:text-gray-300">Policy Prefix</span>
          <input
            type="text"
            bind:value={namingSettings.policyPrefix}
            on:input={handleNamingChange}
            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </label>
      </div>
      
      <div class="mt-4 flex flex-wrap gap-4">
        <label class="inline-flex items-center">
          <input
            type="checkbox"
            bind:checked={namingSettings.useUnderscores}
            on:change={handleNamingChange}
            class="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
          />
          <span class="ml-2 text-gray-700 dark:text-gray-300">Use underscores instead of dashes</span>
        </label>
        
        <label class="inline-flex items-center">
          <input
            type="checkbox"
            bind:checked={namingSettings.includePort}
            on:change={handleNamingChange}
            class="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
          />
          <span class="ml-2 text-gray-700 dark:text-gray-300">Include port in service names</span>
        </label>

        <label class="inline-flex items-center">
          <input
            type="checkbox"
            bind:checked={namingSettings.excludePublicIPs}
            on:change={handleNamingChange}
            class="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
          />
          <span class="ml-2 text-gray-700 dark:text-gray-300">Exclude public IPs</span>
        </label>
      </div>
    </div>
    <FilterPanel on:filter={handleFilter} />
  {/if}
  
  <div class="upload-section mb-8">
    <input
      type="file"
      accept=".csv"
      bind:this={fileInput}
      on:change={handleFileUpload}
      multiple
      class="block w-full text-sm text-gray-900 dark:text-gray-300
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-primary file:text-white
        hover:file:bg-primary/90"
    />
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      You can select multiple files up to 2GB each. Results will be combined automatically.
    </p>
  </div>

  {#if isProcessing}
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
      <div 
        class="bg-primary h-2.5 rounded-full transition-all duration-300"
        style="width: {currentProgress}%"
      ></div>
      <div class="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
        {Math.round(currentProgress)}% processed
        {#if totalFiles > 1}
          <br>
          Processing file {processedFiles + 1} of {totalFiles}
        {/if}
      </div>
    </div>
  {/if}

  {#if status}
    <p class="text-center text-gray-600 dark:text-gray-300 mb-4">{status}</p>
  {/if}

  {#if error}
    <p class="text-center text-red-600 dark:text-red-400 mb-4">{error}</p>
  {/if}

  {#if showErrorPopup}
    <ErrorPopup
      message={error}
      details={errorDetails}
      onClose={closeError}
    />
  {/if}

  {#if results.length > 0}
    <div class="space-y-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Results ({filteredResults.length} entries)</h2>
          <div class="flex items-center space-x-4">
            <label class="text-sm text-gray-600 dark:text-gray-300">
              Items per page:
              <select
                bind:value={itemsPerPage}
                class="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                on:change={() => currentPage = 1}
              >
                {#each itemsPerPageOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </label>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destination</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sources</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              {#each paginatedResults as result}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                    {result.destination.ip}:{result.destination.port}
                  </td>
                  <td class="px-6 py-4 text-gray-900 dark:text-gray-300">
                    {result.sources.join(', ')}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                    {result.service}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        {#if totalPages > 1}
          <div class="flex justify-center items-center space-x-2 mt-4">
            <button
              on:click={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              on:click={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        {/if}
      </div>

      <!-- Address Objects Script -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Address Objects</h2>
          <button
            on:click={() => downloadScript(cliScriptAddresses, 'fortigate_addresses.txt')}
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Download Addresses
          </button>
        </div>
        <div class="relative">
          <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-900 dark:text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
{cliScriptAddresses}</pre>
        </div>
      </div>

      <!-- Service Objects Script -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Service Objects</h2>
          <button
            on:click={() => downloadScript(cliScriptServices, 'fortigate_services.txt')}
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Download Services
          </button>
        </div>
        <div class="relative">
          <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-900 dark:text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
{cliScriptServices}</pre>
        </div>
      </div>

      <!-- Firewall Policies Script -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Firewall Policies</h2>
          <button
            on:click={() => downloadScript(cliScriptPolicies, 'fortigate_policies.txt')}
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Download Policies
          </button>
        </div>
        <div class="relative">
          <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-900 dark:text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
{cliScriptPolicies}</pre>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --primary: #22c55e;
  }
</style> 