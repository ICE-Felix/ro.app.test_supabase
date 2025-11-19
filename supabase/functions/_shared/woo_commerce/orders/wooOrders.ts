/**
 * WooCommerce Orders API
 * Handle order management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#orders
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Order status values per WooCommerce
export enum OrderStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    ON_HOLD = "on-hold",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded",
    FAILED = "failed",
    TRASH = "trash",
}

// Meta data
export interface OrderMetaData {
    id?: number; // read-only
    key: string;
    value: unknown;
}

// Billing and Shipping addresses
export interface OrderBillingAddress {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
}

export interface OrderShippingAddress {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
}

// Tax lines
export interface OrderTaxLine {
    id: number; // read-only
    rate_code: string; // read-only
    rate_id: number; // read-only
    label: string; // read-only
    compound: boolean; // read-only
    tax_total: string; // read-only
    shipping_tax_total: string; // read-only
    meta_data: OrderMetaData[];
}

// Shipping lines
export interface OrderShippingLineTax {
    id?: number;
    rate_id?: number;
    label?: string;
    total?: string;
    subtotal?: string;
}

export interface OrderShippingLine {
    id: number; // read-only
    method_title: string;
    method_id: string;
    total: string;
    total_tax: string; // read-only
    taxes?: OrderShippingLineTax[]; // read-only
    meta_data?: OrderMetaData[];
}

// Fee lines
export interface OrderFeeLineTax {
    id?: number;
    rate_id?: number;
    label?: string;
    total?: string;
    subtotal?: string;
}

export interface OrderFeeLine {
    id: number; // read-only
    name?: string;
    tax_class?: string;
    tax_status?: string;
    total?: string;
    total_tax?: string; // read-only
    taxes?: OrderFeeLineTax[]; // read-only
    meta_data?: OrderMetaData[];
}

// Coupon lines
export interface OrderCouponLine {
    id: number; // read-only
    code?: string;
    discount?: string;
    discount_tax?: string;
    meta_data?: OrderMetaData[];
}

// Refunds
export interface OrderRefund {
    id: number; // read-only
    reason?: string;
    total?: string;
}

// Line items for responses
export interface OrderLineItemRead {
    id: number; // read-only
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string; // before discounts
    subtotal_tax: string; // read-only
    total: string; // after discounts
    total_tax: string; // read-only
    taxes: Array<Record<string, unknown>>; // read-only detailed tax breakdown
    meta_data: OrderMetaData[];
    sku: string; // read-only
    price: string; // read-only
}

// Line items for create/update payloads
export interface OrderLineItemInput {
    product_id: number;
    quantity: number;
    variation_id?: number;
    tax_class?: string;
    subtotal?: string;
    total?: string;
    meta_data?: OrderMetaData[];
}

// Minimal order representation (extendable as needed)
export interface WooOrder {
    id: number; // read-only
    parent_id: number;
    number: string; // read-only
    order_key: string; // read-only
    created_via?: string; // set only during creation
    version?: string; // read-only
    status: OrderStatus | string;
    currency: string;

    date_created: string; // read-only
    date_created_gmt: string; // read-only
    date_modified: string; // read-only
    date_modified_gmt: string; // read-only

    discount_total?: string; // read-only
    discount_tax?: string; // read-only
    shipping_total?: string; // read-only
    shipping_tax?: string; // read-only
    cart_tax?: string; // read-only
    total: string; // read-only
    total_tax?: string; // read-only
    prices_include_tax?: boolean; // read-only

    customer_id: number; // 0 for guests
    customer_ip_address?: string; // read-only
    customer_user_agent?: string; // read-only
    customer_note?: string;

    billing?: OrderBillingAddress;
    shipping?: OrderShippingAddress;

    payment_method?: string;
    payment_method_title?: string;
    transaction_id?: string;

    date_paid?: string; // read-only
    date_paid_gmt?: string; // read-only
    date_completed?: string; // read-only
    date_completed_gmt?: string; // read-only
    cart_hash?: string; // read-only

    meta_data?: OrderMetaData[];
    line_items: OrderLineItemRead[];
    tax_lines?: OrderTaxLine[]; // read-only
    shipping_lines?: OrderShippingLine[];
    fee_lines?: OrderFeeLine[];
    coupon_lines?: OrderCouponLine[];
    refunds?: OrderRefund[]; // read-only

    set_paid?: boolean; // write-only at API level; kept optional here

    _links?: {
        self: Array<{ href: string }>;
        collection: Array<{ href: string }>;
    };
    [key: string]: unknown;
}

export interface WooOrderCreate {
    customer_id?: number;
    status?: OrderStatus | string;
    currency?: string;
    payment_method?: string;
    payment_method_title?: string;
    transaction_id?: string;
    set_paid?: boolean;
    created_via?: string; // can be set on create
    billing?: OrderBillingAddress;
    shipping?: OrderShippingAddress;
    customer_note?: string;
    line_items?: OrderLineItemInput[];
    shipping_lines?: OrderShippingLine[];
    fee_lines?: OrderFeeLine[];
    coupon_lines?: OrderCouponLine[];
    meta_data?: OrderMetaData[];
}

export interface WooOrderUpdate {
    customer_id?: number;
    status?: OrderStatus | string;
    currency?: string;
    payment_method?: string;
    payment_method_title?: string;
    transaction_id?: string;
    set_paid?: boolean;
    billing?: OrderBillingAddress;
    shipping?: OrderShippingAddress;
    customer_note?: string;
    line_items?: OrderLineItemInput[];
    shipping_lines?: OrderShippingLine[];
    fee_lines?: OrderFeeLine[];
    coupon_lines?: OrderCouponLine[];
    meta_data?: OrderMetaData[];
}

export interface WooOrderQuery {
    context?: "view" | "edit";
    page?: number;
    per_page?: number;
    search?: string;
    after?: string;
    before?: string;
    modified_after?: string;
    modified_before?: string;
    dates_are_gmt?: boolean;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: "asc" | "desc";
    orderby?: "date" | "id" | "include" | "title" | "slug";
    status?: string | string[]; // accepts csv or array
    customer?: number; // customer id
    product?: number; // product id present in order
}

export class WooOrders {
    /**
     * Retrieve an order by ID
     * @param orderId - Order ID
     */
    static async getOrderById(orderId: number): Promise<WooOrder> {
        const url = buildWooUrl(`/orders/${orderId}`);
        const response = await fetch(url, {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get order: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Create a new order
     * @param orderData - Order data
     */
    static async createOrder(orderData: WooOrderCreate): Promise<WooOrder> {
        const url = buildWooUrl("/orders");
        const response = await fetch(url, {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create order: ${response.status}`);
        }

        return response.json();
    }

    /**
     * List all orders with optional filtering
     * @param params - Query parameters
     */
    static async getAllOrders(params?: WooOrderQuery): Promise<WooOrder[]> {
        const url = buildWooUrl("/orders", params);
        const response = await fetch(url, {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get orders: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update an existing order
     * @param orderId - Order ID
     * @param orderData - Order updates
     */
    static async updateOrder(
        orderId: number,
        orderData: WooOrderUpdate,
    ): Promise<WooOrder> {
        const url = buildWooUrl(`/orders/${orderId}`);
        const response = await fetch(url, {
            method: "PUT",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error(`Failed to update order: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete an order
     * @param orderId - Order ID
     * @param force - Whether to bypass trash
     */
    static async deleteOrder(
        orderId: number,
        force: boolean = false,
    ): Promise<WooOrder> {
        const url = buildWooUrl(`/orders/${orderId}`, { force });
        const response = await fetch(url, {
            method: "DELETE",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete order: ${response.status}`);
        }

        return response.json();
    }
}
