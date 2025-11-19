import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProducts } from "../../_shared/woo_commerce/products/wooProducts.ts";
import { WooProductCategories } from "../../_shared/woo_commerce/products/wooProductCategories.ts";

// Define query parameters interface
interface ProductsByCategoryQuery {
    categoryId: number;
    search?: string;
    limit?: number;
    offset?: number;
    page?: number;
    status?: string;
    stock_status?: string;
    featured?: boolean;
    on_sale?: boolean;
    type?: string;
    sku?: string;
    [key: string]: unknown;
}

export class ProductsByCategoryWebController
    extends Controller<ProductsByCategoryQuery> {
    private generateHtmlResponse(
        title: string,
        content: string,
        statusCode = 200,
    ): Response {
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 1200px; margin: 0 auto; }
                h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
                h2 { color: #666; margin-top: 30px; }
                .category-info { 
                    background: #e7f3ff; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    border-left: 4px solid #007cba;
                }
                .category-name { 
                    font-size: 1.5em; 
                    font-weight: bold; 
                    color: #007cba; 
                    margin-bottom: 10px;
                }
                .category-details { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 15px; 
                    margin: 15px 0;
                }
                .category-detail { 
                    background: white; 
                    padding: 10px; 
                    border-radius: 4px; 
                    border-left: 3px solid #007cba;
                }
                .products-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
                    gap: 20px; 
                    margin: 20px 0;
                }
                .product-card { 
                    border: 1px solid #ddd; 
                    border-radius: 8px; 
                    padding: 15px; 
                    background: #f9f9f9;
                    transition: transform 0.2s;
                }
                .product-card:hover { 
                    transform: translateY(-2px); 
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .product-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 10px;
                }
                .product-name { 
                    font-weight: bold; 
                    color: #007cba; 
                    font-size: 1.1em;
                }
                .product-id { 
                    background: #007cba; 
                    color: white; 
                    padding: 2px 6px; 
                    border-radius: 3px; 
                    font-size: 0.8em;
                }
                .product-price { 
                    font-size: 1.2em; 
                    font-weight: bold; 
                    color: #e74c3c; 
                    margin: 10px 0;
                }
                .product-meta { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 10px; 
                    margin: 10px 0;
                }
                .meta-item { 
                    background: white; 
                    padding: 5px 8px; 
                    border-radius: 4px; 
                    font-size: 0.9em;
                }
                .status { 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 0.9em; 
                    font-weight: bold; 
                    text-align: center;
                }
                .status.success { background: #d4edda; color: #155724; }
                .status.error { background: #f8d7da; color: #721c24; }
                .status.warning { background: #fff3cd; color: #856404; }
                .status.info { background: #d1ecf1; color: #0c5460; }
                .filters { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 15px 0;
                }
                .filter-item { 
                    display: inline-block; 
                    background: white; 
                    padding: 5px 10px; 
                    margin: 5px; 
                    border-radius: 4px; 
                    border: 1px solid #ddd;
                }
                .pagination { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 20px 0; 
                    text-align: center;
                }
                .json-data { 
                    background: #f4f4f4; 
                    padding: 15px; 
                    border-radius: 4px; 
                    overflow-x: auto; 
                    margin: 15px 0;
                }
                .featured-badge { 
                    background: #ffc107; 
                    color: #212529; 
                    padding: 2px 6px; 
                    border-radius: 3px; 
                    font-size: 0.8em; 
                    margin-left: 10px;
                }
                .on-sale-badge { 
                    background: #dc3545; 
                    color: white; 
                    padding: 2px 6px; 
                    border-radius: 3px; 
                    font-size: 0.8em; 
                    margin-left: 5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Products by Category</h1>
                ${content}
            </div>
        </body>
        </html>
        `;

        return new Response(html, {
            status: statusCode,
            headers: {
                "Content-Type": "text/html",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers":
                    "apikey, x-client-type, Content-Type, Authorization, Accept, Accept-Language, X-Authorization",
                "Access-Control-Allow-Methods":
                    "GET, POST, PUT, DELETE, OPTIONS",
            },
        });
    }

    private formatProductCard(product: any): string {
        const featuredBadge = product.featured
            ? '<span class="featured-badge">★ Featured</span>'
            : "";
        const onSaleBadge = product.on_sale
            ? '<span class="on-sale-badge">🔥 On Sale</span>'
            : "";

        const priceDisplay = product.sale_price && product.on_sale
            ? `<span style="text-decoration: line-through; color: #666;">${product.regular_price}</span> ${product.sale_price}`
            : product.price || product.regular_price;

        return `
            <div class="product-card">
                <div class="product-header">
                    <div class="product-name">${product.name}${featuredBadge}${onSaleBadge}</div>
                    <div class="product-id">ID: ${product.id}</div>
                </div>
                
                <div class="product-price">${priceDisplay} ${
            product.price_html || ""
        }</div>
                
                <div class="product-meta">
                    <div class="meta-item">
                        <strong>SKU:</strong> ${product.sku || "N/A"}
                    </div>
                    <div class="meta-item">
                        <strong>Stock:</strong> ${product.stock_status}
                    </div>
                    <div class="meta-item">
                        <strong>Status:</strong> ${product.status}
                    </div>
                    <div class="meta-item">
                        <strong>Type:</strong> ${product.type}
                    </div>
                </div>
                
                ${
            product.short_description
                ? `
                    <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
                        <strong>Description:</strong> ${product.short_description}
                    </div>
                `
                : ""
        }
                
                ${
            product.categories && product.categories.length > 0
                ? `
                    <div style="margin: 10px 0;">
                        <strong>Categories:</strong> ${
                    product.categories.map((cat: any) => cat.name).join(", ")
                }
                    </div>
                `
                : ""
        }
                
                ${
            product.tags && product.tags.length > 0
                ? `
                    <div style="margin: 10px 0;">
                        <strong>Tags:</strong> ${
                    product.tags.map((tag: any) => tag.name).join(", ")
                }
                    </div>
                `
                : ""
        }
            </div>
        `;
    }

    private formatCategoryInfo(category: any): string {
        return `
            <div class="category-info">
                <div class="category-name">${category.name}</div>
                <div class="category-details">
                    <div class="category-detail">
                        <strong>ID:</strong> ${category.id}
                    </div>
                    <div class="category-detail">
                        <strong>Slug:</strong> ${category.slug}
                    </div>
                    <div class="category-detail">
                        <strong>Parent:</strong> ${category.parent || "None"}
                    </div>
                    <div class="category-detail">
                        <strong>Total Products:</strong> ${category.count}
                    </div>
                </div>
                ${
            category.description
                ? `
                    <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 4px;">
                        <strong>Description:</strong> ${category.description}
                    </div>
                `
                : ""
        }
            </div>
        `;
    }

    private formatFilters(filters: any): string {
        const activeFilters = Object.entries(filters)
            .filter(([key, value]) =>
                value !== null && value !== undefined && value !== ""
            )
            .map(([key, value]) =>
                `<div class="filter-item"><strong>${key}:</strong> ${value}</div>`
            );

        if (activeFilters.length === 0) {
            return '<div class="filters"><strong>Filters:</strong> None applied</div>';
        }

        return `
            <div class="filters">
                <strong>Active Filters:</strong>
                ${activeFilters.join("")}
            </div>
        `;
    }

    private formatPagination(pagination: any): string {
        return `
            <div class="pagination">
                <strong>Pagination:</strong>
                Page ${pagination.current_page} | 
                Showing ${pagination.total_products} products | 
                ${pagination.per_page} per page | 
                Category total: ${pagination.category_total}
            </div>
        `;
    }

    // Get products by category ID
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("ProductsByCategoryWEB GET", { categoryId: id });

        try {
            if (!id || isNaN(parseInt(id))) {
                const content = `
                    <div class="status error">
                        <h2>Error</h2>
                        <p>Valid category ID is required in the URL path</p>
                        <p>Example: /products_by_category/15</p>
                    </div>
                `;
                return this.generateHtmlResponse("Error", content, 400);
            }

            const categoryId = parseInt(id);

            // First, verify the category exists
            try {
                await WooProductCategories.getProductCategory(categoryId);
            } catch (error) {
                const content = `
                    <div class="status error">
                        <h2>Category Not Found</h2>
                        <p>Category with ID ${categoryId} does not exist</p>
                    </div>
                `;
                return this.generateHtmlResponse(
                    "Category Not Found",
                    content,
                    404,
                );
            }

            // Get URL parameters for filtering
            const url = new URL(req!.url);
            const queryParams: any = {
                per_page: parseInt(url.searchParams.get("limit") || "20"),
                page: parseInt(url.searchParams.get("page") || "1"),
            };

            // Add optional filters
            if (url.searchParams.get("search")) {
                queryParams.search = url.searchParams.get("search");
            }
            if (url.searchParams.get("status")) {
                queryParams.status = url.searchParams.get("status") as any;
            }
            if (url.searchParams.get("stock_status")) {
                queryParams.stock_status = url.searchParams.get(
                    "stock_status",
                ) as any;
            }
            if (url.searchParams.get("featured")) {
                queryParams.featured =
                    url.searchParams.get("featured") === "true";
            }
            if (url.searchParams.get("on_sale")) {
                queryParams.on_sale =
                    url.searchParams.get("on_sale") === "true";
            }
            if (url.searchParams.get("type")) {
                queryParams.type = url.searchParams.get("type") as any;
            }
            if (url.searchParams.get("sku")) {
                queryParams.sku = url.searchParams.get("sku");
            }

            // Get products by category
            const products = await WooProducts.getProductsByCategory(
                categoryId,
                queryParams,
            );

            // Get category information
            const category = await WooProductCategories.getProductCategory(
                categoryId,
            );

            const content = `
                ${this.formatCategoryInfo(category)}
                
                ${
                this.formatFilters({
                    search: url.searchParams.get("search"),
                    status: url.searchParams.get("status"),
                    stock_status: url.searchParams.get("stock_status"),
                    featured: url.searchParams.get("featured") === "true"
                        ? "true"
                        : null,
                    on_sale: url.searchParams.get("on_sale") === "true"
                        ? "true"
                        : null,
                    type: url.searchParams.get("type"),
                    sku: url.searchParams.get("sku"),
                })
            }
                
                ${
                this.formatPagination({
                    current_page: queryParams.page,
                    per_page: queryParams.per_page,
                    total_products: products.length,
                    category_total: category.count,
                })
            }
                
                <h2>Products (${products.length})</h2>
                ${
                products.length > 0
                    ? `
                    <div class="products-grid">
                        ${
                        products.map((product) =>
                            this.formatProductCard(product)
                        ).join("")
                    }
                    </div>
                `
                    : `
                    <div class="status info">
                        <h3>No Products Found</h3>
                        <p>No products match the current filters in category "${category.name}"</p>
                    </div>
                `
            }
                
                <h2>Raw Data</h2>
                <div class="json-data">
                    <pre>${
                JSON.stringify({ category, products, queryParams }, null, 2)
            }</pre>
                </div>
            `;

            return this.generateHtmlResponse(
                `Products in: ${category.name}`,
                content,
            );
        } catch (error) {
            console.error("Error in ProductsByCategoryWEB GET:", error);
            const content = `
                <div class="status error">
                    <h2>Error</h2>
                    <p>Failed to retrieve products by category: ${
                error instanceof Error ? error.message : "Unknown error"
            }</p>
                </div>
            `;
            return this.generateHtmlResponse("Error", content, 500);
        }
    }

    // POST, PUT, DELETE methods are not applicable for this read-only endpoint
    override async post(
        data: ProductsByCategoryQuery,
        req?: Request,
    ): Promise<Response> {
        const content = `
            <div class="status warning">
                <h2>Method Not Supported</h2>
                <p>POST method is not supported for the products by category endpoint</p>
                <p>This is a read-only endpoint for retrieving products by category</p>
            </div>
        `;
        return this.generateHtmlResponse("Method Not Supported", content, 405);
    }

    override async put(
        id: string,
        data: ProductsByCategoryQuery,
        req?: Request,
    ): Promise<Response> {
        const content = `
            <div class="status warning">
                <h2>Method Not Supported</h2>
                <p>PUT method is not supported for the products by category endpoint</p>
                <p>This is a read-only endpoint for retrieving products by category</p>
            </div>
        `;
        return this.generateHtmlResponse("Method Not Supported", content, 405);
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        const content = `
            <div class="status warning">
                <h2>Method Not Supported</h2>
                <p>DELETE method is not supported for the products by category endpoint</p>
                <p>This is a read-only endpoint for retrieving products by category</p>
            </div>
        `;
        return this.generateHtmlResponse("Method Not Supported", content, 405);
    }
}
