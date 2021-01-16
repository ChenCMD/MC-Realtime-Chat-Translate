import { download as translate, makeAPIURI, isJapanese, splittedPlayerChat } from '../utils/common';
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

export async function procMessage({ time, message }: Log, config: Config): Promise<string> {
    const chat = message.slice('[CHAT] '.length).replace(/§./g, '');
    // 翻訳元言語が日本語では無く、チャットの日本語の割合が25%を超えている場合はそのまま返す
    if (config.translate.from !== 'ja' && isJapanese(chat, 0.25))
        return `[${time}] ${chat}`;

    const [name, mes] = splittedPlayerChat(chat);
    // 空白行の場合そのまま、でなければ翻訳
    const res = /^\s+$/.test(mes) ? mes : await translate(makeAPIURI(mes, config.translate.from, config.translate.to));
    return `[${time}] ${name}${JSON.parse(res).text}`;
}