import { LogProcessor } from '../src/lib/processors/LogProcessor';
import type { ProcessedEntry } from '../src/lib/processors/LogProcessor';
import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';

describe('LogProcessor', () => {
  let processor: LogProcessor;

  beforeEach(() => {
    processor = new LogProcessor();
  });

  it('should process a single log entry correctly', () => {
    const mockEntry = {
      srcip: '192.168.1.1',
      dstip: '10.0.0.1',
      srcport: '12345',
      dstport: '80',
      proto: '6',
      service: 'HTTP',
      action: 'accept'
    };

    processor.processEntry(mockEntry);

    const entries = processor.getProcessedEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      destination: {
        ip: '10.0.0.1',
        port: '80',
        protocol: '6'
      },
      sources: ['192.168.1.1'],
      service: 'HTTP'
    });
  });

  it('should group multiple source IPs for the same destination', () => {
    const mockEntries = [
      {
        srcip: '192.168.1.1',
        dstip: '10.0.0.1',
        srcport: '12345',
        dstport: '80',
        proto: '6',
        service: 'HTTP',
        action: 'accept'
      },
      {
        srcip: '192.168.1.2',
        dstip: '10.0.0.1',
        srcport: '54321',
        dstport: '80',
        proto: '6',
        service: 'HTTP',
        action: 'accept'
      }
    ];

    mockEntries.forEach(entry => processor.processEntry(entry));

    const entries = processor.getProcessedEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].sources).toContain('192.168.1.1');
    expect(entries[0].sources).toContain('192.168.1.2');
  });

  it('should ignore denied traffic', () => {
    const mockEntry = {
      srcip: '192.168.1.1',
      dstip: '10.0.0.1',
      srcport: '12345',
      dstport: '80',
      proto: '6',
      service: 'HTTP',
      action: 'deny'
    };

    processor.processEntry(mockEntry);

    const entries = processor.getProcessedEntries();
    expect(entries).toHaveLength(0);
  });

  it('should process a real CSV file', async () => {
    const processor = new LogProcessor(true); // Enable debug mode
    const filePath = path.join(__dirname, '../examples/log_deel_000.csv');
    const entries = await processor.processFile(filePath);
    expect(entries.length).toBeGreaterThan(0);
    
    // Verify the structure of the first entry
    const firstEntry = entries[0];
    expect(firstEntry).toHaveProperty('destination');
    expect(firstEntry.destination).toHaveProperty('ip');
    expect(firstEntry.destination).toHaveProperty('port');
    expect(firstEntry.destination).toHaveProperty('protocol');
    expect(firstEntry).toHaveProperty('sources');
    expect(Array.isArray(firstEntry.sources)).toBe(true);
    expect(firstEntry).toHaveProperty('service');
  }, 15000);
}); 