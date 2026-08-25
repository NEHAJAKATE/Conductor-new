"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
exports.config = {
    dataDir: path_1.default.resolve(process.cwd(), 'data'),
    rawDir: path_1.default.resolve(process.cwd(), 'data', 'raw'),
    bronzeDir: path_1.default.resolve(process.cwd(), 'data', 'raw'), // legacy alias
    normalizedDir: path_1.default.resolve(process.cwd(), 'data', 'normalized'),
    silverDir: path_1.default.resolve(process.cwd(), 'data', 'normalized'), // legacy alias
    readyDir: path_1.default.resolve(process.cwd(), 'data', 'ready'),
    goldDir: path_1.default.resolve(process.cwd(), 'data', 'ready'), // legacy alias
    exportsDir: path_1.default.resolve(process.cwd(), 'data', 'exports'),
    r2SimulationDir: path_1.default.resolve(process.cwd(), 'data', 'r2_simulation'),
    // Identity threshold defaults
    identity: {
        namespace: 'e1644781-a67b-4028-a4a3-48b7890b2241', // Custom UUID Namespace
        mergeThreshold: 80,
        reviewThreshold: 60,
    },
    // Default Privacy Governance setting
    privacy: {
        defaultRole: 'Analyst',
    }
};
