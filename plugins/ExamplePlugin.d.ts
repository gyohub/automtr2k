import { Plugin, PluginContext } from '../dist/src/types';
export default class ExamplePlugin implements Plugin {
    name: string;
    description: string;
    version: string;
    execute(context: PluginContext): Promise<void>;
}
//# sourceMappingURL=ExamplePlugin.d.ts.map