import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooRaw } from "../../_shared/woo_commerce/wooRaw.ts";

interface StockCheckItem {
  product_id: number;
  quantity: number;
}

interface StockCheckRequestBody {
  items?: StockCheckItem[];
  [key: string]: unknown;
}

export class WooStockCheckApiController
  extends Controller<StockCheckRequestBody | StockCheckItem[]> {
  private parseItems(
    body: StockCheckRequestBody | StockCheckItem[] | unknown,
  ): StockCheckItem[] {
    if (Array.isArray(body)) {
      return body as StockCheckItem[];
    }
    if (
      body && typeof body === "object" &&
      Array.isArray((body as StockCheckRequestBody).items)
    ) {
      return (body as StockCheckRequestBody).items as StockCheckItem[];
    }
    return [];
  }

  private validateItems(
    items: StockCheckItem[],
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Array.isArray(items) || items.length === 0) {
      errors.push("items must be a non-empty array");
      return { isValid: false, errors };
    }

    for (const [index, item] of items.entries()) {
      if (!item || typeof item !== "object") {
        errors.push(`items[${index}] must be an object`);
        continue;
      }
      if (
        typeof item.product_id !== "number" ||
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0
      ) {
        errors.push(`items[${index}].product_id must be a positive integer`);
      }
      if (
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        errors.push(`items[${index}].quantity must be a positive integer`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  override get(_id?: string, _req?: Request): Promise<Response> {
    return Promise.resolve(ResponseService.error(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405,
      undefined,
      ResponseType.API,
    ));
  }

  override async post(
    data: StockCheckRequestBody | StockCheckItem[],
    _req?: Request,
  ): Promise<Response> {
    this.logAction("WooStockCheckAPI POST", { data });

    try {
      const items = this.parseItems(data);
      const validation = this.validateItems(items);
      if (!validation.isValid) {
        return ResponseService.error(
          "Validation failed",
          "VALIDATION_ERROR",
          400,
          { errors: validation.errors },
          ResponseType.API,
        );
      }

      // Call WooCommerce stock verification endpoint via pass-through
      const payload = { cart_items: items };
      const result = await WooRaw.post<unknown>("/stock/verify-cart", payload);
      return ResponseService.success(result, 200, undefined, ResponseType.API);
    } catch (error) {
      return ResponseService.error(
        error instanceof Error ? error.message : "Failed to check stock",
        "WOO_STOCK_CHECK_ERROR",
        500,
        undefined,
        ResponseType.API,
      );
    }
  }

  override put(
    _id: string,
    _data: StockCheckRequestBody | StockCheckItem[],
    _req?: Request,
  ): Promise<Response> {
    return Promise.resolve(ResponseService.error(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405,
      undefined,
      ResponseType.API,
    ));
  }

  override delete(_id: string, _req?: Request): Promise<Response> {
    return Promise.resolve(ResponseService.error(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405,
      undefined,
      ResponseType.API,
    ));
  }
}
