import { createLogWatcher } from './logWatcher';
import { getConfig } from './types/Config';

async function run(dir: string): Promise<void> {
    const config = await getConfig(dir);
    const wathcer = createLogWatcher(config.gameDir, async log => console.log(log));

    process.on('SIGINT', async () => await wathcer.close());
}

run(process.cwd());