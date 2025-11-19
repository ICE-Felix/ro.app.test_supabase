// Utilities to build generic payload bases and apply field-specific overrides

export type BuildOptions = {
    exclude?: string[];
};

export function buildPayloadBase(
    data: Record<string, unknown>,
    options?: BuildOptions,
): Record<string, unknown> {
    const exclude = new Set(options?.exclude ?? []);
    const base: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (exclude.has(key)) continue;
        if (value === undefined) continue;
        if (typeof value === "string") {
            const t = value.trim();
            base[key] = t.length > 0 ? t : null;
        } else {
            base[key] = value as unknown;
        }
    }
    return base;
}

export type OverrideFn = (
    currentValue: unknown,
    data: Record<string, unknown>,
    key: string,
    base: Record<string, unknown>,
) => unknown | undefined;

export function applyOverrides(
    base: Record<string, unknown>,
    data: Record<string, unknown>,
    overrides: Record<string, OverrideFn | undefined>,
): Record<string, unknown> {
    const result = { ...base };
    for (const [key, fn] of Object.entries(overrides)) {
        if (!fn) continue;
        const newValue = fn(result[key], data, key, result);
        if (newValue !== undefined) {
            result[key] = newValue;
        }
    }
    return result;
}

export function toArrayOrNull(
    value: string[] | string | null | undefined,
): string[] | null {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) return value;
    return value.trim().length > 0 ? [value.trim()] : null;
}

export function normalizeBoolean(
    value: boolean | string | number | null | undefined,
): boolean | null {
    if (value === undefined || value === null) return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        return value === "1" || value.toLowerCase() === "true";
    }
    if (typeof value === "number") return value === 1;
    return null;
}
