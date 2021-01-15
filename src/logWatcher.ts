import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { FileCantAccessError } from './types/Error';
import { Log } from './types/Log';
import { resolveEnvPath } from './utils/common';
import { readFile } from './utils/file';

/**
 * @license
 *  * MIT License
 *
 * Copyright (c) 2020 MT224244
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export function createLogWatcher(gameDir: string, onNewLogEvent: (log: Log) => void | Promise<void>): chokidar.FSWatcher {
    const logPath = path.join(resolveEnvPath(gameDir), 'logs', 'latest.log');

    if (!fs.existsSync(logPath))
        throw new FileCantAccessError('logファイルにアクセスできませんでした。config.jsonのgameDirを確認してください。');

    let start = fs.statSync(logPath).size;

    const watcher = chokidar.watch(logPath, { persistent: false });

    watcher.on('ready', () => {
        console.log('Realtime chat translate - ready.');
        watcher.on('change', async (_path, stats) => {
            if (!stats || stats.size < 2)
                return;

            if (stats.size < start)
                start = 0;

            const lines = await readFile(logPath, { start, end: stats.size - 2 });

            for (const line of lines.split('\n')) {
                const [, time, message] = /\[([^\]]*)\]\s\[[^\]]*\]:\s(.*)\n?/.exec(line) ?? [];
                if (time && message)
                    onNewLogEvent({ time, message });
            }
            start = stats.size;
        });
    });

    return watcher;
}