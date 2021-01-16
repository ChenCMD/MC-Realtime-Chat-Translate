import https from 'https';
import { SafeError, TranslateFailedError } from '../types/Error';

/**
 * パスの環境変数を解決します。
 */
export function resolveEnvPath(path: string): string {
    return path.split(/(\/|\\)/)
        .map(v => /^%[^%]+%$/.test(v) ? process.env[v.slice(1, -1)] ?? v : v)
        .join('/');
}

/**
 * 一定時間処理を遅延させます。
 */
export async function wait(milisec: number): Promise<void> {
    return await new Promise(resolve => setTimeout(() => resolve(), milisec));
}

/**
 * URIよりデータをダウンロードします。
 * この関数はリダイレクトを想定した動作をします。
 */
export async function download(uri: string, retryCount = 0): Promise<string> {
    try {
        const otherUri = await new Promise<string>((resolve, reject) =>
            https.get(uri, res => res.headers.location ? resolve(res.headers.location) : reject()).end()
        );
        const result = await new Promise<string>((resolve, reject) =>
            https.get(otherUri, res => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(body));
                res.on('error', reject);
            }).end()
        );
        return result;
    } catch (e) {
        if (retryCount < 5) {
            retryCount++;
            await wait(50 * retryCount);
            return await download(uri, retryCount);
        }
        throw new TranslateFailedError('翻訳に失敗しました。翻訳サーバーもしくはネット環境に問題がある可能性があります。');
    }
}

/**
 * 翻訳APIのURIを作成します。
 */
export function makeAPIURI(message: string, fromLang: string, toLang: string): string {
    const base = 'https://script.google.com/macros/s/AKfycbw06SaK3lL360YFNMmQgq2Z3JBhs5NOIC8uEhRt37BLmYr5rtPWRwrEdQ/exec';
    const url = `${base}?text=${encodeURI(message)}&source=${encodeURI(fromLang)}&target=${encodeURI(toLang)}`;
    return url;
}

/**
 * エラー発生時の汎用処理
 */
export function catchProc(err: Error): void {
    if (err instanceof SafeError) {
        console.log(err.toString());
    } else {
        console.log('予期しないエラーが発生しました。以下の内容を作者に教えていただけると解決できる場合があります。');
        throw err;
    }
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