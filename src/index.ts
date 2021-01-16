import { createLogWatcher } from './logWatcher';
import { getConfig } from './types/Config';
import { FileCantAccessError, MissingConfigError } from './types/Error';
import { isChatMessage, procMessage } from './types/Log';

async function run(dir: string): Promise<void> {
    try {
        const config = await getConfig(dir);
        const wathcer = createLogWatcher(config.gameDir, async log => {
            if (!isChatMessage(log))
                return;
            console.log(await procMessage(log, config));
        });

        process.on('SIGINT', async () => {
            wathcer.close();
            process.exit();
        });
    } catch (e) {
        if (e instanceof FileCantAccessError || e instanceof MissingConfigError) {
            console.log(e.toString());
        } else {
            console.log('予期しないエラーが発生しました。以下の内容を作者に教えていただけると解決できる場合があります。');
            throw e;
        }
    }
}

run(process.cwd());