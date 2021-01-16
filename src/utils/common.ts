import https from 'https';

export function resolveEnvPath(path: string): string {
    return path.split(/(\/|\\)/)
        .map(v => /^%[^%]+%$/.test(v) ? process.env[v.slice(1, -1)] ?? v : v)
        .join('/');
}

export async function wait(milisec: number): Promise<void> {
    return await new Promise(resolve => setTimeout(() => resolve(), milisec));
}

export async function download(uri: string): Promise<string> {
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
        await wait(100);
        return await download(uri);
    }
}

export function getAPIURL(message: string, fromLang: string, toLang: string): string {
    const base = 'https://script.google.com/macros/s/AKfycbw06SaK3lL360YFNMmQgq2Z3JBhs5NOIC8uEhRt37BLmYr5rtPWRwrEdQ/exec';
    const url = `${base}?text=${encodeURI(message)}&source=${encodeURI(fromLang)}&target=${encodeURI(toLang)}`;
    return url;
}