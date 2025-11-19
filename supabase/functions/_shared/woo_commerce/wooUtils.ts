/**
 * WooCommerce Utilities
 * Centralized configuration and utility functions for WooCommerce API
 */

// WooCommerce API Configuration
export interface WooCommerceConfig {
    /** Base URL for WooCommerce API */
    baseUrl: string;
    /** Consumer Key for authentication */
    consumerKey: string;
    /** Consumer Secret for authentication */
    consumerSecret: string;
    /** API Version */
    version: string;
}

// Default configuration - should be updated with your actual WooCommerce details
export const WOO_CONFIG: WooCommerceConfig = {
    baseUrl: "https://shop.mommyhai.com/wp-json/wc/v3",
    consumerKey: "ck_69d5ec4e0351c66c9b334daa7477c9bc7b4da0d1",
    consumerSecret: "cs_7a907a1af0dd9e70fc4885ad9d4422b5a57008c4",
    version: "v3",
};

/**
 * Get authentication headers for WooCommerce API
 * @returns Authentication headers object
 */
export function getWooAuthHeaders(): Record<string, string> {
    const auth = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
    return {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
    };
}

/**
 * Build URL with query parameters
 * @param endpoint - API endpoint path
 * @param params - Query parameters object
 * @returns Complete URL with query parameters
 */
export function buildWooUrl(
    endpoint: string,
    params?: Record<string, any>,
): string {
    const url = new URL(`${WOO_CONFIG.baseUrl}${endpoint}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach((v) =>
                        url.searchParams.append(key, v.toString())
                    );
                } else {
                    url.searchParams.append(key, value.toString());
                }
            }
        });
    }

    return url.toString();
}
