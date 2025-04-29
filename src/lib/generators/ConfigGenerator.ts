import type { ProcessedEntry } from '../processors/LogProcessor';

export class ConfigGenerator {
  private addressObjects: Map<string, string[]>;
  private serviceObjects: Map<string, string[]>;
  private firewallPolicies: string[];

  constructor() {
    this.addressObjects = new Map();
    this.serviceObjects = new Map();
    this.firewallPolicies = [];
  }

  private generateAddressObject(ip: string, name: string): string {
    return `config firewall address
    edit "${name}"
        set subnet ${ip}/32
    next
end`;
  }

  private generateServiceObject(port: string, protocol: string, name: string): string {
    return `config firewall service custom
    edit "${name}"
        set ${protocol}-portrange ${port}
    next
end`;
  }

  private generateFirewallPolicy(
    srcAddress: string,
    dstAddress: string,
    service: string,
    policyId: number
  ): string {
    return `config firewall policy
    edit ${policyId}
        set name "Auto-generated Policy ${policyId}"
        set srcintf "any"
        set dstintf "any"
        set srcaddr "${srcAddress}"
        set dstaddr "${dstAddress}"
        set action accept
        set schedule "always"
        set service "${service}"
        set logtraffic all
    next
end`;
  }

  public generateConfig(entries: ProcessedEntry[]): {
    addressObjects: string[];
    serviceObjects: string[];
    firewallPolicies: string[];
  } {
    this.addressObjects.clear();
    this.serviceObjects.clear();
    this.firewallPolicies = [];

    let policyId = 1;

    entries.forEach((entry) => {
      // Generate address objects
      const dstAddressName = `dst_${entry.destination.ip.replace(/\./g, '_')}`;
      if (!this.addressObjects.has(dstAddressName)) {
        this.addressObjects.set(
          dstAddressName,
          [this.generateAddressObject(entry.destination.ip, dstAddressName)]
        );
      }

      // Generate service object
      const serviceName = `svc_${entry.destination.port}_${entry.destination.protocol}`;
      if (!this.serviceObjects.has(serviceName)) {
        this.serviceObjects.set(
          serviceName,
          [this.generateServiceObject(entry.destination.port, entry.destination.protocol, serviceName)]
        );
      }

      // Generate firewall policies for each source IP
      entry.sources.forEach((srcIp: string) => {
        const srcAddressName = `src_${srcIp.replace(/\./g, '_')}`;
        if (!this.addressObjects.has(srcAddressName)) {
          this.addressObjects.set(
            srcAddressName,
            [this.generateAddressObject(srcIp, srcAddressName)]
          );
        }

        this.firewallPolicies.push(
          this.generateFirewallPolicy(srcAddressName, dstAddressName, serviceName, policyId++)
        );
      });
    });

    return {
      addressObjects: Array.from(this.addressObjects.values()).flat(),
      serviceObjects: Array.from(this.serviceObjects.values()).flat(),
      firewallPolicies: this.firewallPolicies
    };
  }
} 