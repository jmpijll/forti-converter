import { describe, it, expect, beforeEach } from 'vitest';
import { CLIGenerator } from '../CLIGenerator';
import type { ProcessedEntry } from '../../processors/LogProcessor';

describe('CLIGenerator', () => {
  let generator: CLIGenerator;
  let testEntries: ProcessedEntry[];

  beforeEach(() => {
    generator = new CLIGenerator();
    testEntries = [
      {
        destination: {
          ip: '192.168.1.1',
          port: '443',
          protocol: '6'
        },
        sources: ['10.0.0.1', '10.0.0.2'],
        service: 'HTTPS'
      },
      {
        destination: {
          ip: '192.168.1.2',
          port: '80',
          protocol: '6'
        },
        sources: ['10.0.0.3'],
        service: 'HTTP'
      }
    ];
  });

  it('should generate address objects', () => {
    const script = generator.generate(testEntries);
    expect(script).toContain('config firewall address');
    expect(script).toContain('edit "addr_192_168_1_1"');
    expect(script).toContain('edit "addr_192_168_1_2"');
    expect(script).toContain('edit "addr_10_0_0_1"');
    expect(script).toContain('edit "addr_10_0_0_2"');
    expect(script).toContain('edit "addr_10_0_0_3"');
  });

  it('should generate service objects', () => {
    const script = generator.generate(testEntries);
    expect(script).toContain('config firewall service custom');
    expect(script).toContain('edit "svc_6_443"');
    expect(script).toContain('edit "svc_6_80"');
  });

  it('should generate firewall policies', () => {
    const script = generator.generate(testEntries);
    expect(script).toContain('config firewall policy');
    expect(script).toContain('set srcaddr "addr_10_0_0_1" "addr_10_0_0_2"');
    expect(script).toContain('set srcaddr "addr_10_0_0_3"');
    expect(script).toContain('set dstaddr "addr_192_168_1_1"');
    expect(script).toContain('set dstaddr "addr_192_168_1_2"');
  });

  it('should include comments in generated objects', () => {
    const script = generator.generate(testEntries);
    expect(script).toContain('set comment "Generated from FortiAnalyzer logs"');
  });

  it('should handle empty input', () => {
    const script = generator.generate([]);
    expect(script).toContain('config firewall address');
    expect(script).toContain('config firewall service custom');
    expect(script).toContain('config firewall policy');
  });
}); 