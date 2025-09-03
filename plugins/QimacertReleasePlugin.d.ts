import { Plugin, PluginContext } from '../dist/src/types';
export default class QimacertReleasePlugin implements Plugin {
    name: string;
    description: string;
    version: string;
    execute(context: PluginContext): Promise<void>;
}
//# sourceMappingURL=QimacertReleasePlugin.d.ts.map