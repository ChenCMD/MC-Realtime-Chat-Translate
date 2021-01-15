export class ErrorTemplate extends Error {
    constructor(e?: string) {
        super(e);
        this.name = new.target.name;
    }

    toString(): string {
        return this.message ? `[ERROR] ${this.message}` : `${this.name}`;
    }
}

export class MissingConfigError extends ErrorTemplate { }
export class FileCantAccessError extends ErrorTemplate { }