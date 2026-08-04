import path from 'path';

export const config = {
  dataDir: path.resolve(process.cwd(), 'data'),
  rawDir: path.resolve(process.cwd(), 'data', 'raw'),
  bronzeDir: path.resolve(process.cwd(), 'data', 'raw'), // legacy alias
  normalizedDir: path.resolve(process.cwd(), 'data', 'normalized'),
  silverDir: path.resolve(process.cwd(), 'data', 'normalized'), // legacy alias
  readyDir: path.resolve(process.cwd(), 'data', 'ready'),
  goldDir: path.resolve(process.cwd(), 'data', 'ready'), // legacy alias
  exportsDir: path.resolve(process.cwd(), 'data', 'exports'),
  r2SimulationDir: path.resolve(process.cwd(), 'data', 'r2_simulation'),
  
  // Identity threshold defaults
  identity: {
    namespace: 'e1644781-a67b-4028-a4a3-48b7890b2241', // Custom UUID Namespace
    mergeThreshold: 80,
    reviewThreshold: 60,
  },
  
  // Default Privacy Governance setting
  privacy: {
    defaultRole: 'Analyst' as 'Analyst' | 'Manager' | 'Admin',
  }
};
