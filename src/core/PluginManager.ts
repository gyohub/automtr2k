import { Plugin, PluginContext } from '../types';
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
        path.join(__dirname, '../../plugins')
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

      const pluginFiles = await fs.readdir(this.pluginsDir);
      
      for (const file of pluginFiles) {
        if (file.endsWith('.js')) {
          try {
            const pluginPath = path.resolve(this.pluginsDir, file);
            const pluginModule = require(pluginPath);
            
            if (pluginModule.default) {
              const PluginClass = pluginModule.default;
              try {
                // Instantiate the plugin class
                const plugin = new PluginClass();
                if (this.isValidPlugin(plugin)) {
                  this.plugins.set(plugin.name, plugin);
                  console.log(`✅ Loaded plugin: ${plugin.name} v${plugin.version}`);
                }
              } catch (error) {
                console.warn(`⚠️  Failed to instantiate plugin:`, error);
              }
            }
          } catch (error) {
            console.warn(`⚠️  Failed to load plugin from ${file}:`, error);
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
      typeof plugin.execute === 'function'
    );
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async executePlugin(name: string, context: PluginContext): Promise<void> {
    const plugin = this.getPlugin(name);
    if (!plugin) {
      throw new Error(`Plugin '${name}' not found`);
    }

    console.log(`🚀 Executing plugin: ${plugin.name}`);
    console.log(`📝 Description: ${plugin.description}`);
    
    try {
      await plugin.execute(context);
      console.log(`✅ Plugin '${plugin.name}' executed successfully`);
    } catch (error) {
      console.error(`❌ Plugin '${plugin.name}' failed:`, error);
      throw error;
    }
  }

  listPlugins(): void {
    if (this.plugins.size === 0) {
      console.log('No plugins loaded');
      return;
    }

    console.log('\n📦 Available Plugins:');
    console.log('=====================');
    
    for (const plugin of this.plugins.values()) {
      console.log(`• ${plugin.name} v${plugin.version}`);
      console.log(`  ${plugin.description}`);
      console.log('');
    }
  }
}
