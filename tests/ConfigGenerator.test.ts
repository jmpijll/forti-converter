import { ConfigGenerator } from '../src/lib/generators/ConfigGenerator';
import type { ProcessedEntry } from '../src/lib/processors/LogProcessor';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ConfigGenerator', () => {
  let generator: ConfigGenerator;
  let mockEntries: ProcessedEntry[];

  beforeEach(() => {
    generator = new ConfigGenerator();
    mockEntries = [
      {
        destination: {
          ip: '10.0.0.1',
          port: '80',
          protocol: '6'
        },
        sources: ['192.168.1.1', '192.168.1.2'],
        service: 'HTTP'
      },
      {
        destination: {
          ip: '10.0.0.2',
          port: '443',
          protocol: '6'
        },
        sources: ['192.168.1.3'],
        service: 'HTTPS'
      }
    ];
  });

  it('should generate address objects correctly', () => {
    const config = generator.generateConfig(mockEntries);
    
    // Check for destination address objects
    expect(config.addressObjects).toContain(
      `config firewall address
    edit "dst_10_0_0_1"
        set subnet 10.0.0.1/32
    next
end`
    );
    expect(config.addressObjects).toContain(
      `config firewall address
    edit "dst_10_0_0_2"
        set subnet 10.0.0.2/32
    next
end`
    );

    // Check for source address objects
    expect(config.addressObjects).toContain(
      `config firewall address
    edit "src_192_168_1_1"
        set subnet 192.168.1.1/32
    next
end`
    );
    expect(config.addressObjects).toContain(
      `config firewall address
    edit "src_192_168_1_2"
        set subnet 192.168.1.2/32
    next
end`
    );
    expect(config.addressObjects).toContain(
      `config firewall address
    edit "src_192_168_1_3"
        set subnet 192.168.1.3/32
    next
end`
    );
  });

  it('should generate service objects correctly', () => {
    const config = generator.generateConfig(mockEntries);
    
    expect(config.serviceObjects).toContain(
      `config firewall service custom
    edit "svc_80_6"
        set 6-portrange 80
    next
end`
    );
    expect(config.serviceObjects).toContain(
      `config firewall service custom
    edit "svc_443_6"
        set 6-portrange 443
    next
end`
    );
  });

  it('should generate firewall policies correctly', () => {
    const config = generator.generateConfig(mockEntries);
    
    // Check first policy
    expect(config.firewallPolicies[0]).toContain('set srcaddr "src_192_168_1_1"');
    expect(config.firewallPolicies[0]).toContain('set dstaddr "dst_10_0_0_1"');
    expect(config.firewallPolicies[0]).toContain('set service "svc_80_6"');

    // Check second policy
    expect(config.firewallPolicies[1]).toContain('set srcaddr "src_192_168_1_2"');
    expect(config.firewallPolicies[1]).toContain('set dstaddr "dst_10_0_0_1"');
    expect(config.firewallPolicies[1]).toContain('set service "svc_80_6"');

    // Check third policy
    expect(config.firewallPolicies[2]).toContain('set srcaddr "src_192_168_1_3"');
    expect(config.firewallPolicies[2]).toContain('set dstaddr "dst_10_0_0_2"');
    expect(config.firewallPolicies[2]).toContain('set service "svc_443_6"');
  });
}); 