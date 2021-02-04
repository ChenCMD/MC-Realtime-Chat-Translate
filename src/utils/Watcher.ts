import fs from 'fs';
import fsp from 'fs/promises';
import { Void } from '../types/common';
import { pathAccessible } from './file';

export class Watcher {
    private readonly _loopStopID: NodeJS.Timeout;
    private onChangeCallback: (stats: fs.Stats) => Void;
    private latestModifyTime: number;

    constructor(private readonly filePath: string, private readonly checkInterval = 200, private readonly debugMode = false) {
        this.check(false);
        this._loopStopID = setInterval(async () => await this.check(), checkInterval);
    }

    on(event: 'change', callback: (stats: fs.Stats) => Void): this {
        this.onChangeCallback = callback;
        return this;
    }

    private async check(isDoCallback = true) {
        if (!await pathAccessible(this.filePath)) {
            if (this.debugMode)
                console.log(`[${new Date().toISOString()}] [Watcher] latest.log can't accessible.`);
            return;
        }

        const stat = await fsp.stat(this.filePath);

        if (stat.mtimeMs === this.latestModifyTime) {
            if (this.debugMode)
                console.log(`[${new Date().toISOString()}] [Watcher] latest.log not modify. - ${stat.mtimeMs} - ${stat.size}`);
            return;
        }

        this.latestModifyTime = stat.mtimeMs;
        if (this.debugMode)
            console.log(`[${new Date().toISOString()}] [Watcher] latest.log hook modified`);
        if (isDoCallback)
            this.onChangeCallback(stat);
    }

    close(): void {
        clearInterval(this._loopStopID);
    }
}