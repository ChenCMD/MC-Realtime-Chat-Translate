import { createLogWatcher } from './logWatcher';
import { getConfig } from './types/Config';
import { procMessage } from './types/Log';
import { catchProc, isChatMessage, wait } from './utils/common';
import { Watcher } from './utils/Watcher';

async function run(dir: string): Promise<void> {
    try {
        const config = await getConfig(dir);
        const watcher = createLogWatcher(config.gameDir, config, async log => {
            if (!isChatMessage(log.message))
                return;
            console.log(await procMessage(log, config));
        });

        process.on('SIGINT', async () => await exit(watcher));
    } catch (e) {
        catchProc(e);
        exit();
    }
}

async function exit(watcher?: Watcher): Promise<void> {
    watcher?.close();
    // エラーが出力された後、ウィンドウが閉じたら見えないからこれで延命させる。
    // eslint-disable-next-line no-constant-condition
    while (true) await wait(2147483647);
}

run(process.cwd());