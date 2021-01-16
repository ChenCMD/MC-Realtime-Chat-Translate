import { createLogWatcher } from './logWatcher';
import { getConfig } from './types/Config';
import { isChatMessage, procMessage } from './types/Log';
import { catchProc } from './utils/common';
import { Watcher } from './utils/Watcher';

async function run(dir: string): Promise<void> {
    try {
        const config = await getConfig(dir);
        const watcher = createLogWatcher(config.gameDir, config.checkIntervalMS, async log => {
            if (!isChatMessage(log.message))
                return;
            try {
                console.log(await procMessage(log, config));
            } catch (e) {
                catchProc(e);
                exit(watcher);
            }
        });

        process.on('SIGINT', async () => exit(watcher));
    } catch (e) {
        catchProc(e);
    }
}

async function exit(watcher: Watcher): Promise<void> {
    watcher.close();
    process.exit();
}

run(process.cwd());