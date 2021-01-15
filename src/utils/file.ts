import fs from 'fs';
import fsp from 'fs/promises';

/**
 * ファイルの内容を読み取ります。
 * @param path ファイルパス
 * @param readSection 読み取る範囲
 */
export async function readFile(path: string, readSection?: { start: number, end: number }): Promise<string> {
    return await new Promise((resolve, reject) => {
        let data = '';

        fs.createReadStream(path, { encoding: 'utf-8', highWaterMark: 256 * 1024, ...readSection })
            .on('data', chunk => data += chunk)
            .on('end', () => resolve(data))
            .on('error', reject);
    });
}

/**
 * ファイルを作成します
 * @param filePath ファイルパス
 * @param content 内容
 * @throws FileSystemError ファイルが既に存在する場合
 */
export async function createFile(filePath: string, content: string): Promise<void> {
    if (await pathAccessible(filePath))
        throw new Error(`${filePath}は既に生成されています。`);
    else
        await fsp.writeFile(filePath, content);
}

/**
 * パスが存在するか、アクセス可能かを判別します
 * @param testPath 確認するパス
 * @license
 * MIT License
 *
 * Copyright (c) 2019-2020 SPGoding
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
export async function pathAccessible(testPath: string): Promise<boolean> {
    return await fsp.access(testPath)
        .then(() => true)
        .catch(() => false);
}