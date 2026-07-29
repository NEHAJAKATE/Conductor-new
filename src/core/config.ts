import path from 'path';

export const config = {
  dataDir: path.resolve(process.cwd(), 'data'),
  bronzeDir: path.resolve(process.cwd(), 'data', 'bronze'),
  silverDir: path.resolve(process.cwd(), 'data', 'silver'),
  goldDir: path.resolve(process.cwd(), 'data', 'gold'),
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
