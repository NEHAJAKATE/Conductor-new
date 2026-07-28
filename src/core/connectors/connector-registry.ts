import { ConnectorPlugin, ConnectorType } from './connector';

export class ConnectorRegistry {
  private registry = new Map<ConnectorType, ConnectorPlugin>();

  register(plugin: ConnectorPlugin): void {
    this.registry.set(plugin.type, plugin);
  }

  get(type: ConnectorType): ConnectorPlugin | undefined {
    return this.registry.get(type);
  }

  list(): ConnectorPlugin[] {
    return Array.from(this.registry.values());
  }
}
