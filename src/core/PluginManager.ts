import { Plugin, PluginContext, PluginCategory } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsDir!: string;

  constructor(pluginsDir?: string) {
    if (pluginsDir) {
      this.pluginsDir = pluginsDir;
    } else {
      // Try to find plugins directory relative to the current working directory
      const possiblePaths = [
        './dist/plugins',
        './plugins',
        path.join(process.cwd(), 'dist/plugins'),
        path.join(process.cwd(), 'plugins'),
        path.join(__dirname, '../../plugins'),
        path.join(__dirname, '../../../plugins')
      ];
      
      let foundPath = false;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          this.pluginsDir = possiblePath;
          foundPath = true;
          break;
        }
      }
      
      if (!foundPath) {
        this.pluginsDir = './plugins';
      }
    }
  }

  async loadPlugins(): Promise<void> {
    try {
      if (!(await fs.pathExists(this.pluginsDir))) {
        console.log(`Plugins directory ${this.pluginsDir} does not exist. Creating...`);
        await fs.ensureDir(this.pluginsDir);
        return;
      }

      const pluginDirs = await fs.readdir(this.pluginsDir);
      
      for (const dir of pluginDirs) {
        const pluginDirPath = path.join(this.pluginsDir, dir);
        const stat = await fs.stat(pluginDirPath);
        
        if (stat.isDirectory()) {
          // Look for index.js or index.ts in the plugin directory
          const possibleIndexFiles = [
            path.join(pluginDirPath, 'index.js'),
            path.join(pluginDirPath, 'index.ts')
          ];
          
          let pluginFile = null;
          for (const indexFile of possibleIndexFiles) {
            if (await fs.pathExists(indexFile)) {
              pluginFile = indexFile;
              break;
            }
          }
          
          if (pluginFile) {
            try {
              // Use path.resolve to get the absolute path for require
              const absolutePluginPath = path.resolve(pluginFile);
              const pluginModule = require(absolutePluginPath);
              
              if (pluginModule.default) {
                const PluginClass = pluginModule.default;
                try {
                  // Instantiate the plugin class
                  const plugin = new PluginClass();
                  if (this.isValidPlugin(plugin)) {
                    this.plugins.set(plugin.name, plugin);
                    console.log(`✅ Loaded plugin: ${plugin.name} v${plugin.version} (${plugin.category})`);
                  }
                } catch (error) {
                  console.warn(`⚠️  Failed to instantiate plugin from ${dir}:`, error);
                }
              }
            } catch (error) {
              console.warn(`⚠️  Failed to load plugin from ${dir}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading plugins:', error);
    }
  }

  private isValidPlugin(plugin: any): plugin is Plugin {
    return (
      (typeof plugin === 'object' || typeof plugin === 'function') &&
      typeof plugin.name === 'string' &&
      typeof plugin.description === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.category === 'string' &&
      typeof plugin.execute === 'function'
    );
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByCategory(category: PluginCategory): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.category === category);
  }

  async executePlugin(name: string, context: PluginContext): Promise<void> {
    const plugin = this.getPlugin(name);
    if (!plugin) {
      throw new Error(`Plugin '${name}' not found`);
    }

    console.log(`🚀 Executing plugin: ${plugin.name} (${plugin.category})`);
    await plugin.execute(context);
  }

  listPlugins(): void {
    if (this.plugins.size === 0) {
      console.log('No plugins loaded.');
      return;
    }

    console.log('\n🔌 Available Plugins:');
    console.log('=====================');
    
    // Group plugins by category
    const pluginsByCategory = new Map<PluginCategory, Plugin[]>();
    
    for (const plugin of this.plugins.values()) {
      if (!pluginsByCategory.has(plugin.category)) {
        pluginsByCategory.set(plugin.category, []);
      }
      pluginsByCategory.get(plugin.category)!.push(plugin);
    }

    // Display plugins by category
    for (const [category, plugins] of pluginsByCategory) {
      console.log(`\n${this.getCategoryEmoji(category)} ${category.toUpperCase()}:`);
      plugins.forEach((plugin, index) => {
        console.log(`  ${index + 1}. ${plugin.name} v${plugin.version}`);
        console.log(`     ${plugin.description}`);
      });
    }
  }

  private getCategoryEmoji(category: PluginCategory): string {
    switch (category) {
      case PluginCategory.GIT:
        return '🔧';
      case PluginCategory.COMMUNICATION:
        return '💬';
      case PluginCategory.BUILD:
        return '🏗️';
      case PluginCategory.RELEASE:
        return '🚀';
      case PluginCategory.UTILITY:
        return '🛠️';
      case PluginCategory.CUSTOM:
        return '🎯';
      default:
        return '📦';
    }
  }
}
