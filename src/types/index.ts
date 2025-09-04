export interface Plugin {
  name: string;
  description: string;
  version: string;
  category: PluginCategory;
  execute: (context: PluginContext) => Promise<void>;
  getConfigMenu?: () => ConfigMenu; // Optional configuration menu
}

export enum PluginCategory {
  GIT = 'git',
  COMMUNICATION = 'communication',
  BUILD = 'build',
  RELEASE = 'release',
  UTILITY = 'utility',
  CUSTOM = 'custom'
}

export interface PluginContext {
  // Core properties
  projectFolder?: string;
  options: Record<string, any>;
  
  // Git-specific properties (for backward compatibility)
  tagName?: string;
  baseBranches?: BaseBranches;
  
  // New general properties
  repositories?: Repository[];
  selectedRepository?: Repository;
  environment?: string;
  target?: string;
  parameters?: Record<string, any>;
}

export interface BaseBranches {
  develop: string;
  production: string;
  type: 'standard' | 'custom';
}

export interface Repository {
  name: string;
  path: string;
  baseBranches?: BaseBranches;
  lastUsed?: Date;
  // New properties for general automation
  type?: 'git' | 'svn' | 'other';
  url?: string;
  credentials?: {
    username?: string;
    token?: string;
  };
  settings?: Record<string, any>;
}

export interface AutomationConfig {
  repositories: Repository[];
  environments: EnvironmentConfig[];
  integrations: IntegrationConfig;
  defaultTag?: string;
  defaultBaseBranches?: BaseBranches;
}

export interface EnvironmentConfig {
  name: string;
  type: 'development' | 'staging' | 'production' | 'custom';
  variables: Record<string, any>;
  repositories: string[];
}

export interface IntegrationConfig {
  slack?: SlackConfig;
  github?: GitHubConfig;
  jira?: JiraConfig;
  email?: EmailConfig;
  webhook?: WebhookConfig;
}

export interface SlackConfig {
  enabled: boolean;
  webhookUrl?: string;
  token?: string;
  channels: string[];
  defaultChannel: string;
}

export interface GitHubConfig {
  enabled: boolean;
  token?: string;
  apiUrl?: string;
  organization?: string;
}

export interface JiraConfig {
  enabled: boolean;
  url?: string;
  username?: string;
  token?: string;
  projectKey?: string;
}

export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  credentials: {
    username: string;
    password: string;
  };
  recipients: string[];
}

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
}

// Legacy interfaces for backward compatibility
export interface ReleaseConfig extends AutomationConfig {}
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

// New result interfaces for general automation
export interface AutomationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export interface GitOperationResult extends AutomationResult {
  operation: 'clone' | 'pull' | 'push' | 'merge' | 'branch' | 'tag' | 'commit';
  repository: string;
  branch?: string;
  commit?: string;
}

export interface CommunicationResult extends AutomationResult {
  platform: 'slack' | 'email' | 'webhook' | 'jira';
  recipients: string[];
  message: string;
}

export interface BuildResult extends AutomationResult {
  buildType: 'java' | 'node' | 'python' | 'docker' | 'custom';
  artifacts: string[];
  buildTime: number;
}

export interface DeploymentResult extends AutomationResult {
  environment: string;
  target: string;
  deployedAt: Date;
  rollbackAvailable: boolean;
}

// Configuration Menu Types
export interface ConfigMenu {
  title: string;
  description: string;
  options: ConfigMenuOption[];
}

export interface ConfigMenuOption {
  key: string;
  label: string;
  description: string;
  type: 'input' | 'select' | 'boolean' | 'multiselect' | 'file';
  required?: boolean;
  default?: any;
  choices?: string[]; // For select/multiselect types
  validation?: (value: any) => string | null; // Returns error message or null if valid
}

export interface PluginSettings {
  [key: string]: any;
}
