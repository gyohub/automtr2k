export interface Plugin {
  name: string;
  description: string;
  version: string;
  execute: (context: PluginContext) => Promise<void>;
}

export interface PluginContext {
  projectFolder: string;
  tagName: string;
  baseBranches: BaseBranches;
  options: Record<string, any>;
}

export interface BaseBranches {
  develop: string;
  production: string;
  type: 'standard' | 'qimacert';
}

export interface Repository {
  name: string;
  path: string;
  baseBranches: BaseBranches;
  lastUsed?: Date;
}

export interface ReleaseConfig {
  repositories: Repository[];
  defaultTag?: string;
  defaultBaseBranches?: BaseBranches;
}

export interface GitStatus {
  isClean: boolean;
  currentBranch: string;
  hasConflicts: boolean;
  conflicts: string[];
  untracked: string[];
  modified: string[];
}

export interface ReleaseResult {
  success: boolean;
  rollbackTag?: string;
  releaseBranch?: string;
  versionTag?: string;
  finalReleaseBranch?: string;
  error?: string;
}
