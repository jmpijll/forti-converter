import type { ProcessedEntry } from '../processors/LogProcessor';

interface AddressObject {
  name: string;
  subnet: string;
  comment: string;
}

interface ServiceObject {
  name: string;
  protocol: string;
  port: string;
  comment: string;
}

interface FirewallPolicy {
  name: string;
  srcintf: string;
  dstintf: string;
  srcaddr: string[];
  dstaddr: string;
  service: string;
  action: string;
  comment: string;
}

export class CLIGenerator {
  private addressObjects: Map<string, AddressObject>;
  private serviceObjects: Map<string, ServiceObject>;
  private firewallPolicies: FirewallPolicy[];

  constructor() {
    this.addressObjects = new Map();
    this.serviceObjects = new Map();
    this.firewallPolicies = [];
  }

  private generateAddressObjectName(ip: string): string {
    return `addr_${ip.replace(/\./g, '_')}`;
  }

  private generateServiceObjectName(protocol: string, port: string): string {
    return `svc_${protocol}_${port}`;
  }

  private generatePolicyName(srcaddr: string[], dstaddr: string, service: string): string {
    const src = srcaddr.join('_');
    const dst = dstaddr.replace(/\./g, '_');
    return `policy_${src}_to_${dst}_${service}`;
  }

  public generate(entries: ProcessedEntry[]): string {
    this.addressObjects.clear();
    this.serviceObjects.clear();
    this.firewallPolicies = [];

    // Process each entry to generate objects and policies
    entries.forEach(entry => {
      // Create destination address object
      const dstAddrName = this.generateAddressObjectName(entry.destination.ip);
      this.addressObjects.set(dstAddrName, {
        name: dstAddrName,
        subnet: `${entry.destination.ip}/32`,
        comment: `Generated from FortiAnalyzer logs`
      });

      // Create service object
      const svcName = this.generateServiceObjectName(
        entry.destination.protocol,
        entry.destination.port
      );
      this.serviceObjects.set(svcName, {
        name: svcName,
        protocol: entry.destination.protocol,
        port: entry.destination.port,
        comment: `Generated from FortiAnalyzer logs`
      });

      // Create source address objects and firewall policy
      const srcAddrNames = entry.sources.map(src => {
        const name = this.generateAddressObjectName(src);
        this.addressObjects.set(name, {
          name,
          subnet: `${src}/32`,
          comment: `Generated from FortiAnalyzer logs`
        });
        return name;
      });

      this.firewallPolicies.push({
        name: this.generatePolicyName(entry.sources, entry.destination.ip, svcName),
        srcintf: 'any',
        dstintf: 'any',
        srcaddr: srcAddrNames,
        dstaddr: dstAddrName,
        service: svcName,
        action: 'accept',
        comment: `Generated from FortiAnalyzer logs`
      });
    });

    // Generate CLI script
    let script = 'config firewall address\n';
    
    // Add address objects
    this.addressObjects.forEach(addr => {
      script += `    edit "${addr.name}"\n`;
      script += `        set subnet ${addr.subnet}\n`;
      script += `        set comment "${addr.comment}"\n`;
      script += '    next\n';
    });
    script += 'end\n\n';

    // Add service objects
    script += 'config firewall service custom\n';
    this.serviceObjects.forEach(svc => {
      script += `    edit "${svc.name}"\n`;
      script += `        set protocol ${svc.protocol}\n`;
      script += `        set tcp-portrange ${svc.port}\n`;
      script += `        set comment "${svc.comment}"\n`;
      script += '    next\n';
    });
    script += 'end\n\n';

    // Add firewall policies
    script += 'config firewall policy\n';
    this.firewallPolicies.forEach(policy => {
      script += `    edit 0\n`;
      script += `        set name "${policy.name}"\n`;
      script += `        set srcintf "${policy.srcintf}"\n`;
      script += `        set dstintf "${policy.dstintf}"\n`;
      script += `        set srcaddr ${policy.srcaddr.map(addr => `"${addr}"`).join(' ')}\n`;
      script += `        set dstaddr "${policy.dstaddr}"\n`;
      script += `        set service "${policy.service}"\n`;
      script += `        set action ${policy.action}\n`;
      script += `        set comment "${policy.comment}"\n`;
      script += '    next\n';
    });
    script += 'end\n';

    return script;
  }
} 