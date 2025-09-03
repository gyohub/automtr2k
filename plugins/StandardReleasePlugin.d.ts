import { Plugin, PluginContext } from '../dist/src/types';
export default class StandardReleasePlugin implements Plugin {
    name: string;
    description: string;
    version: string;
    execute(context: PluginContext): Promise<void>;
}
//# sourceMappingURL=StandardReleasePlugin.d.ts.map