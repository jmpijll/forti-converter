import { parse } from 'csv-parse/browser/esm/sync';

interface LogEntry {
  srcip: string;
  dstip: string;
  srcport: string;
  dstport: string;
  proto: string;
  service: string;
  action: string;
}

export interface ProcessedEntry {
  destination: {
    ip: string;
    port: string;
    protocol: string;
  };
  sources: string[];
  service: string;
}

export class LogProcessor {
  private processedEntries: Map<string, ProcessedEntry>;
  private debug: boolean;
  private chunkSize: number;
  private onProgress?: (progress: number) => void;

  constructor(debug = true, chunkSize = 1024 * 1024) { // 1MB chunks by default
    this.processedEntries = new Map();
    this.debug = debug;
    this.chunkSize = chunkSize;
  }

  public setProgressCallback(callback: (progress: number) => void) {
    this.onProgress = callback;
  }

  private getEntryKey(entry: LogEntry): string {
    return `${entry.dstip}:${entry.dstport}:${entry.proto}`;
  }

  private parseValue(value: string): string {
    if (!value) return '';
    
    // Remove outer quotes
    value = value.replace(/^"/, '').replace(/"$/, '');
    
    // Extract value from key=value format
    const keyValueMatch = value.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch) {
      // Handle double-quoted values (e.g., key=""value"")
      let extractedValue = keyValueMatch[2];
      extractedValue = extractedValue.replace(/^""/, '').replace(/""$/, '');
      return extractedValue;
    }
    
    return value;
  }

  private findFieldInLine(line: string, fieldName: string): string {
    const regex = new RegExp(`"${fieldName}=(?:"")?([^"]+)(?:"")?"`, 'i');
    const match = line.match(regex);
    if (match) {
      return match[1];
    }
    return '';
  }

  private processEntry(entry: LogEntry): void {
    if (this.debug) {
      console.log('Processing entry:', entry);
    }

    // Compare the actual string values since we're dealing with string comparisons
    if (entry.action.toLowerCase() !== 'accept' || !entry.dstip || !entry.dstport) {
      if (this.debug) {
        console.log('Skipping entry:', {
          action: entry.action,
          dstip: entry.dstip,
          dstport: entry.dstport
        });
      }
      return;
    }

    const key = this.getEntryKey(entry);
    const existingEntry = this.processedEntries.get(key);

    if (existingEntry) {
      if (!existingEntry.sources.includes(entry.srcip)) {
        existingEntry.sources.push(entry.srcip);
        if (this.debug) {
          console.log('Added source IP to existing entry:', {
            key,
            srcip: entry.srcip
          });
        }
      }
    } else {
      this.processedEntries.set(key, {
        destination: {
          ip: entry.dstip,
          port: entry.dstport,
          protocol: entry.proto,
        },
        sources: [entry.srcip],
        service: entry.service
      });
      if (this.debug) {
        console.log('Created new entry:', {
          key,
          entry: this.processedEntries.get(key)
        });
      }
    }
  }

  private async processChunk(chunk: string, partialLine: string): Promise<string> {
    const lines = (partialLine + chunk).split('\n');
    // Save the last partial line for the next chunk
    const newPartialLine = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;

      const entry: LogEntry = {
        srcip: this.findFieldInLine(line, 'srcip'),
        dstip: this.findFieldInLine(line, 'dstip'),
        srcport: this.findFieldInLine(line, 'srcport'),
        dstport: this.findFieldInLine(line, 'dstport'),
        proto: this.findFieldInLine(line, 'proto'),
        service: this.findFieldInLine(line, 'service'),
        action: this.findFieldInLine(line, 'action')
      };

      this.processEntry(entry);
    }

    return newPartialLine;
  }

  public mergeResults(existingResults: ProcessedEntry[], newResults: ProcessedEntry[]): ProcessedEntry[] {
    // Create a map of existing results for faster lookup
    const resultMap = new Map<string, ProcessedEntry>();
    
    // Add existing results to the map
    for (const entry of existingResults) {
      const key = `${entry.destination.ip}:${entry.destination.port}:${entry.destination.protocol}`;
      resultMap.set(key, entry);
    }
    
    // Merge new results, combining sources for matching entries
    for (const newEntry of newResults) {
      const key = `${newEntry.destination.ip}:${newEntry.destination.port}:${newEntry.destination.protocol}`;
      const existingEntry = resultMap.get(key);
      
      if (existingEntry) {
        // Merge sources, ensuring uniqueness
        const uniqueSources = new Set([...existingEntry.sources, ...newEntry.sources]);
        existingEntry.sources = Array.from(uniqueSources);
      } else {
        // Add new entry
        resultMap.set(key, newEntry);
      }
    }
    
    return Array.from(resultMap.values());
  }

  public async processFile(fileContent: string): Promise<ProcessedEntry[]> {
    this.processedEntries.clear();
    let processedBytes = 0;
    const totalBytes = fileContent.length;
    let partialLine = '';

    try {
      if (this.debug) {
        console.log('Starting file processing');
        console.log(`Total file size: ${totalBytes} bytes`);
      }

      // Process the file in chunks
      for (let i = 0; i < fileContent.length; i += this.chunkSize) {
        const chunk = fileContent.slice(i, i + this.chunkSize);
        partialLine = await this.processChunk(chunk, partialLine);
        
        processedBytes = i + chunk.length;
        if (this.onProgress) {
          this.onProgress(Math.min((processedBytes / totalBytes) * 100, 99));
        }
      }

      // Process any remaining partial line
      if (partialLine.trim()) {
        await this.processChunk(partialLine, '');
      }

      if (this.onProgress) {
        this.onProgress(100);
      }

      const results = Array.from(this.processedEntries.values());
      if (this.debug) {
        console.log('Final processed entries:', results.length);
        if (results.length > 0) {
          console.log('Sample entry:', results[0]);
        }
      }
      return results;
    } catch (error) {
      console.error('Processing error:', error);
      throw new Error(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processLine(line: string) {
    try {
      // Process the line and update processedEntries
      // Implementation depends on your specific CSV format
    } catch (error) {
      if (this.debug) {
        console.warn('Error processing line:', error);
      }
    }
  }

  public getProcessedEntries(): ProcessedEntry[] {
    return Array.from(this.processedEntries.values());
  }
} 