import path from 'path';
import { createFile, pathAccessible, readFile } from '../utils/file';
import { MissingConfigError } from './Error';

export interface Config {
    gameDir: string
    from: string
    to: string
}

const defaultConfig: Config = {
    gameDir: '%AppData%/.minecraft',
    from: 'en',
    to: 'ja'
};

export async function getConfig(rootDir: string): Promise<Config> {
    const configPath = path.join(rootDir, 'config.json');
    if (!await pathAccessible(configPath)) {
        createFile(configPath, JSON.stringify(defaultConfig, undefined, ' '.repeat(4)));
        throw new MissingConfigError('configファイルが存在しません。');
    }

    const fileData = await readFile(configPath);
    const parsedConfig = JSON.parse(fileData);

    // Error Region
    for (const key of Object.keys(defaultConfig)) {
        if (!parsedConfig[key])
            throw new MissingConfigError(`config内にkey:"${key}"が存在しません。`);
    }

    return parsedConfig;
}