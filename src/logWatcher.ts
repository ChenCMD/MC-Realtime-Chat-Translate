import fs from 'fs';
import path from 'path';
import { Void } from './types/common';
import { Config } from './types/Config';
import { FileCantAccessError } from './types/Error';
import { Log } from './types/Log';
import { catchProc, resolveEnvPath } from './utils/common';
import { readFile } from './utils/file';
import { Watcher } from './utils/Watcher';
import { exit } from './index';

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
export function createLogWatcher(gameDir: string, { checkIntervalMS, debugMode }: Config, onNewLogEvent: (log: Log) => Void): Watcher {
    const logPath = path.join(resolveEnvPath(gameDir), 'logs', 'latest.log');

    if (!fs.existsSync(logPath))
        throw new FileCantAccessError('logファイルにアクセスできませんでした。config.jsonのgameDirを確認してください。');

    let start = fs.statSync(logPath).size;

    const watcher = new Watcher(logPath, checkIntervalMS, debugMode);

    console.log('Realtime chat translate - ready.');
    watcher.on('change', async stats => {
        try {
            if (stats.size < 2) {
                if (debugMode)
                    console.log(`[${new Date().toISOString()}] [MCRCT] file size is small - ${stats.size}`);
                return;
            }

            if (stats.size < start)
                start = 0;

            const lines = await readFile(logPath, { start, end: stats.size - 2 });

            for (const line of lines.split('\n')) {
                const [, time, message] = /^\[([^\]]+)\].*]: (.*)\r?\n?$/.exec(line) ?? [];
                if (time && message) {
                    if (debugMode)
                        console.log(`[${new Date().toISOString()}] [MCRCT] parse success`);
                    await onNewLogEvent({ time, message });
                } else {
                    if (debugMode && line.startsWith('[')) {
                        console.log(`[${new Date().toISOString()}] [MCRCT] parse failed`);
                        console.log(`[${new Date().toISOString()}] parse result: ${/^\[([^\]]+)\].*]: (.*)\r?\n?$/.exec(line)}`);
                        console.log(`[${new Date().toISOString()}] line: ${line}`);
                        console.log(`[${new Date().toISOString()}] time: ${time}`);
                        console.log(`[${new Date().toISOString()}] message: ${message}`);
                    }
                }
            }
            start = stats.size;
        } catch (e) {
            catchProc(e);
            exit(watcher);
        }
    });

    return watcher;
}