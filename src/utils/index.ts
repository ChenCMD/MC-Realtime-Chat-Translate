export function resolveEnvPath(path: string): string {
    return path.split(/(\/|\\)/)
        .map(v => /^%[^%]+%$/.test(v) ? process.env[v.slice(1, -1)] ?? v : v)
        .join('/');
}