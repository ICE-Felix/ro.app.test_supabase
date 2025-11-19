import { buildWooUrl, getWooAuthHeaders } from "./wooUtils.ts";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RawRequestOptions {
    params?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
}

export class WooRaw {
    static async request<T = unknown>(
        method: HttpMethod,
        path: string,
        options?: RawRequestOptions,
    ): Promise<T> {
        const url = buildWooUrl(path, options?.params);
        const headers: Record<string, string> = {
            ...getWooAuthHeaders(),
            ...(options?.headers || {}),
        };

        const response = await fetch(url, {
            method,
            headers,
            body: options?.body !== undefined
                ? JSON.stringify(options.body)
                : undefined,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Woo API error ${response.status}: ${text}`);
        }

        // Some endpoints may return empty body (e.g., 204)
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return await response.json();
        }
        const text = await response.text();
        try {
            return JSON.parse(text) as T;
        } catch {
            return text as unknown as T;
        }
    }

    static get<T = unknown>(
        path: string,
        params?: Record<string, unknown>,
    ): Promise<T> {
        return this.request<T>("GET", path, { params });
    }

    static post<T = unknown>(
        path: string,
        body?: unknown,
        params?: Record<string, unknown>,
    ): Promise<T> {
        return this.request<T>("POST", path, { body, params });
    }

    static put<T = unknown>(
        path: string,
        body?: unknown,
        params?: Record<string, unknown>,
    ): Promise<T> {
        return this.request<T>("PUT", path, { body, params });
    }

    static patch<T = unknown>(
        path: string,
        body?: unknown,
        params?: Record<string, unknown>,
    ): Promise<T> {
        return this.request<T>("PATCH", path, { body, params });
    }

    static delete<T = unknown>(
        path: string,
        params?: Record<string, unknown>,
    ): Promise<T> {
        return this.request<T>("DELETE", path, { params });
    }
}
