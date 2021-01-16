import fs from 'fs';
import fsp from 'fs/promises';
import { Void } from '../types/common';
import { pathAccessible } from './file';

export class Watcher {
    private readonly _loopStopID: NodeJS.Timeout;
    private onChangeCallback: (stats: fs.Stats) => Void;
    private latestModifyTime: number;

    constructor(private readonly filePath: string, checkInterval = 200) {
        this.check(false);
        this._loopStopID = setInterval(async () => await this.check(), checkInterval);
    }

    on(event: 'change', callback: (stats: fs.Stats) => Void): this {
        this.onChangeCallback = callback;
        return this;
    }

    private async check(isDoCallbak = true) {
        if (!await pathAccessible(this.filePath)) return;

        const stat = await fsp.stat(this.filePath);

        if (stat.mtimeMs === this.latestModifyTime)
            return;

        this.latestModifyTime = stat.mtimeMs;
        if (isDoCallbak)
            this.onChangeCallback(stat);
    }

    close(): void {
        clearInterval(this._loopStopID);
    }
}