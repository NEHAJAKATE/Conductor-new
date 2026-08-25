"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorRegistry = void 0;
class ConnectorRegistry {
    registry = new Map();
    register(plugin) {
        this.registry.set(plugin.type, plugin);
    }
    get(type) {
        return this.registry.get(type);
    }
    list() {
        return Array.from(this.registry.values());
    }
}
exports.ConnectorRegistry = ConnectorRegistry;
