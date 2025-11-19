import { WooRaw } from "../wooRaw.ts";

export interface WooShopQuery {
    page?: number;
    per_page?: number;
    search?: string;
    [key: string]: unknown;
}

export class WooShops {
    static getAll(params?: WooShopQuery): Promise<unknown[]> {
        return WooRaw.get<unknown[]>("/shops", params);
    }

    static search(
        query: string,
        params?: Omit<WooShopQuery, "search">,
    ): Promise<unknown[]> {
        return WooRaw.get<unknown[]>("/shops", {
            ...(params || {}),
            search: query,
        });
    }

    static getById(id: number | string): Promise<unknown> {
        return WooRaw.get<unknown>(`/shops/${id}`);
    }

    static create(payload: unknown): Promise<unknown> {
        return WooRaw.post<unknown>("/shops", payload);
    }

    static update(id: number | string, payload: unknown): Promise<unknown> {
        return WooRaw.put<unknown>(`/shops/${id}`, payload);
    }

    static delete(id: number | string, force?: boolean): Promise<unknown> {
        const params = force !== undefined ? { force } : undefined;
        return WooRaw.delete<unknown>(`/shops/${id}`, params);
    }
}
