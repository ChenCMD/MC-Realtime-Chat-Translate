export abstract class ErrorTemplate extends Error {
    constructor(e?: string) {
        super(e);
        this.name = new.target.name;
    }

    toString(): string {
        return this.message ? `[ERROR] ${this.message}` : `${this.name}`;
    }
}

export class SafeError extends ErrorTemplate { }

export class MissingConfigError extends SafeError { }
export class FileCantAccessError extends SafeError { }
export class TranslateFailedError extends SafeError { }