/**
 * TypeScript declarations for DirectoryConfiguration class
 */

declare class DirectoryConfiguration {
  constructor();

  // Properties
  directories: any[];
  metadata: any;
  initialized: boolean;
  filterCache: Map<any, any>;
  version: string;
  overridesApplied: boolean;
  maxCacheSize: number;
  tierHierarchy: { [key: string]: number };
  fieldSelectors: { [key: string]: string[] };

  // Methods
  initialize(): Promise<boolean>;
  loadDirectoryConfigurations(): Promise<void>;
  getDirectoryById(id: string): any;
  getDirectoriesByTier(tier: string): any[];
  getDirectoriesByCategory(category: string): any[];
  getFieldSelectors(fieldType: string): string[];
  isDirectoryAvailableForTier(directoryId: string, customerTier: string): boolean;
  getAvailableDirectories(customerTier: string): any[];
  applyOverrides(overrides: any[]): boolean;
  updateDirectoryConfig(id: string, updates: any): boolean;
  addDirectoryConfig(config: any): boolean;
  getStatistics(): any;
}

declare const _default: typeof DirectoryConfiguration;
export default _default;