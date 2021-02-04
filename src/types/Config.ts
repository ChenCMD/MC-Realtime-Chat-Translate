import path from 'path';
import { createFile, pathAccessible, readFile } from '../utils/file';
import { MissingConfigError } from './Error';

export interface Config {
    gameDir: string
    checkIntervalMS: number;
    translate: {
        from: string
        to: string
    },
    debugMode: boolean
}

const defaultConfig: Config = {
    gameDir: '%AppData%/.minecraft',
    checkIntervalMS: 200,
    translate: {
        from: 'en',
        to: 'ja'
    },
    debugMode: false
};

export async function getConfig(rootDir: string): Promise<Config> {
    const configPath = path.join(rootDir, 'config.json');
    if (!await pathAccessible(configPath)) {
        createFile(configPath, JSON.stringify(defaultConfig, undefined, ' '.repeat(4)));
        throw new MissingConfigError('configファイルが存在しません。');
    }

    try {
        const fileData = await readFile(configPath);
        const parsedConfig = JSON.parse(fileData);

        // Error Region
        for (const key of Object.keys(defaultConfig)) {
            if (!parsedConfig[key] === undefined)
                throw new MissingConfigError(`config内にkey:"${key}"が存在しません。`);
        }

        return parsedConfig;
    } catch (e) {
        if (e instanceof SyntaxError)
            throw new MissingConfigError('configファイルの構文に問題があります。');
        else
            throw e;
    }
}