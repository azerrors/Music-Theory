export function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key)
        return raw ? {...fallback, ...JSON.parse(raw)} : fallback
    } catch {
        return fallback
    }
}

export function writeJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Private mode or a full quota — settings simply stop persisting.
    }
}
