import { download, makeAPIURIs, isJapanese, splittedPlayerChat, getRedirectUri } from '../utils/common';
import { Config } from './Config';

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
export interface Log {
    time: string
    message: string
}

export async function procMessage({ time, message }: Log, { translate }: Config): Promise<string> {
    const out = (...mes: string[]) => `[${time}] ${mes.join('')}`;

    const chat = message.slice('[CHAT] '.length).replace(/§./g, '');
    // 翻訳元言語が日本語では無く、チャットの日本語の割合が25%を超えている場合はそのまま返す
    if (translate.from !== 'ja' && isJapanese(chat, 0.25))
        return out(chat);

    const [name, mes] = splittedPlayerChat(chat);
    // メッセージが空白の場合そのまま返す
    if (/^\s+$/.test(mes))
        return out(mes);

    try {
        const errorMes = '翻訳サーバーへの接続に失敗しました。翻訳サーバーもしくはネット環境に問題がある可能性があります。';
        const translateUris = makeAPIURIs(mes, translate.from, translate.to);
        const uri = await Promise.race(translateUris.map(v => getRedirectUri(v, errorMes)));
        const res = await download(uri, errorMes);
        console.log(`name: ${name}`);
        console.log(`res: ${res}`);
        return out(name, JSON.parse(res).text);
    } catch (e) {
        return e.toString();
    }
}