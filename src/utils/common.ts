import https from 'https';
import path from 'path';
import { env } from 'process';
import { SafeError, TranslateFailedError as DownloadFailedError } from '../types/Error';

/**
 * パスの環境変数を解決します。
 */
export function resolveEnvPath(filePath: string): string {
    const [firstPath, otherPath] = filePath.replace('\\', '/').split('/', 2);
    if (firstPath === '~')
        return `${env['USERPROFILE']}/${otherPath}`;
    if (/^%[^%]+%$/.test(firstPath))
        return path.join(env[firstPath.slice(1, -1)] ?? firstPath, otherPath);
    return filePath;
}

/**
 * 一定時間処理を遅延させます。
 */
export async function wait(milisec: number): Promise<void> {
    return await new Promise(resolve => setTimeout(() => resolve(), milisec));
}

/**
 * URIよりリダイレクトURIを取得します。
 */
export async function getRedirectUri(uri: string, failedMessage?: string, retryCount = 0): Promise<string> {
    try {
        return await new Promise<string>((resolve, reject) =>
            https.get(uri, res => res.headers.location ? resolve(res.headers.location) : reject()).end()
        );
    } catch (e) {
        if (retryCount < 4) {
            await wait(25 * ++retryCount);
            return await getRedirectUri(uri, failedMessage, retryCount);
        }
        throw new DownloadFailedError(failedMessage);
    }
}

/**
 * URIよりデータをダウンロードします。
 */
export async function download(uri: string, failedMessage?: string, retryCount = 0): Promise<string> {
    try {
        return await new Promise<string>((resolve, reject) =>
            https.get(uri, res => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(body));
                res.on('error', reject);
            }).end()
        );
    } catch (e) {
        if (retryCount < 4) {
            await wait(25 * ++retryCount);
            return await download(uri, failedMessage, retryCount);
        }
        throw new DownloadFailedError(failedMessage);
    }
}

/**
 * 翻訳APIのURIを作成します。
 */
export function makeAPIURIs(message: string, fromLang: string, toLang: string): string[] {
    const baseUris = [
        'https://script.google.com/macros/s/AKfycbw06SaK3lL360YFNMmQgq2Z3JBhs5NOIC8uEhRt37BLmYr5rtPWRwrEdQ/exec',
        'https://script.google.com/macros/s/AKfycbyEN9BZWOk2ZbPQaCMHPl-DkDFN5TuCNuPEsbWfmFS1Lon6IAAXMd7x/exec',
        'https://script.google.com/macros/s/AKfycbwgsxkZPRziopNx5aT5bwNDp_WyEKdPBRLDM6p2YB3BCWgiaum7Su9I/exec',
        'https://script.google.com/macros/s/AKfycbz3Kj_yu3qA8rJ2vaJ5SDu2YvH8tiMh4uX6SRBGAAXPXFu7xZuzvS61/exec'
    ];
    return baseUris.map(v => `${v}?text=${encodeURI(message)}&source=${encodeURI(fromLang)}&target=${encodeURI(toLang)}`);
}

/**
 * エラー発生時の汎用処理
 */
export function catchProc(err: Error): void {
    const illegalMessage = '予期しないエラーが発生しました。以下の内容を作者に教えていただけると解決できる場合があります。';
    console.log(err instanceof SafeError ? err.toString() : `${illegalMessage}\n${err}`);
}

/**
 * logがCHATの場合はtrueを返します。
 */
export function isChatMessage(log: string): boolean {
    return log.startsWith('[CHAT] ');
}

/**
 * messageの日本語の割合がthreshold値以上であればtrueを返します。
 */
export function isJapanese(message: string, threshold: number): boolean {
    const charCount = message.length;
    const japaneseCharCount = message.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]/g)?.length ?? 0;

    return japaneseCharCount / charCount >= threshold;
}

/**
 * messageをプレイヤー名部とメッセージ部に分割します。
 * messageがプレイヤーによるものではない場合プレイヤー部は''が入ります。
 */
export function splittedPlayerChat(message: string): [string, string] {
    const playerNameRegex = /^<[a-zA-Z0-9_]{0,16}> /;
    if (!playerNameRegex.test(message))
        return ['', message];
    const playerName = message.match(playerNameRegex)![0];
    return [playerName, message.slice(playerName.length)];
}