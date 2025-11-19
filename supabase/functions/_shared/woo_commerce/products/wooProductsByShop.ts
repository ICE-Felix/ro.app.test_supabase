import { WooRaw } from "../wooRaw.ts";
import type { WooProduct, WooProductQuery } from "./wooProducts.ts";

export class WooProductsByShop {
    static getByShopId(
        shopId: number | string,
        query?: WooProductQuery,
    ): Promise<WooProduct[]> {
        return WooRaw.get<WooProduct[]>(
            `/products/shop/${shopId}`,
            query as unknown as Record<string, unknown>,
        );
    }
}
