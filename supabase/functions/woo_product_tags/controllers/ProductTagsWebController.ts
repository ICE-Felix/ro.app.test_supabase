import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProductTags } from "../../_shared/woo_commerce/products/wooProductTags.ts";

// Define product tag data interface
interface ProductTagData {
    id?: number;
    name: string;
    slug?: string;
    description?: string;
    [key: string]: unknown;
}

export class ProductTagsWebController extends Controller<ProductTagData> {
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
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
                h2 { color: #666; margin-top: 30px; }
                .tag-card { 
                    border: 1px solid #ddd; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin: 15px 0; 
                    background: #f9f9f9;
                }
                .tag-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 15px;
                }
                .tag-name { 
                    font-size: 1.2em; 
                    font-weight: bold; 
                    color: #007cba;
                }
                .tag-id { 
                    background: #007cba; 
                    color: white; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 0.9em;
                }
                .tag-details { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 10px; 
                    margin: 15px 0;
                }
                .detail-item { 
                    padding: 8px; 
                    background: white; 
                    border-radius: 4px; 
                    border-left: 3px solid #007cba;
                }
                .detail-label { 
                    font-weight: bold; 
                    color: #555; 
                    display: block; 
                    margin-bottom: 5px;
                }
                .status { 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 0.9em; 
                    font-weight: bold;
                }
                .status.success { background: #d4edda; color: #155724; }
                .status.error { background: #f8d7da; color: #721c24; }
                .json-data { 
                    background: #f4f4f4; 
                    padding: 15px; 
                    border-radius: 4px; 
                    overflow-x: auto; 
                    margin: 15px 0;
                }
                .metadata { 
                    background: #e9ecef; 
                    padding: 10px; 
                    border-radius: 4px; 
                    margin: 10px 0; 
                    font-size: 0.9em;
                }
                .count-badge {
                    background: #28a745;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd; 
                }
                th { 
                    background-color: #f8f9fa; 
                    font-weight: bold; 
                }
                tr:hover { background-color: #f5f5f5; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>WooCommerce Product Tags API</h1>
                ${content}
            </div>
        </body>
        </html>
        `;

        return new Response(html, {
            status: statusCode,
            headers: { "Content-Type": "text/html" },
        });
    }

    private formatTagsForDisplay(tags: any[]): string {
        if (!tags || tags.length === 0) {
            return "<p>No tags found.</p>";
        }

        if (tags.length === 1) {
            return this.formatSingleTag(tags[0]);
        }

        return this.formatMultipleTags(tags);
    }

    private formatSingleTag(tag: any): string {
        const description = tag.description || "No description available";
        const count = tag.count || 0;

        return `
            <div class="tag-card">
                <div class="tag-header">
                    <span class="tag-name">${tag.name}</span>
                    <span class="tag-id">ID: ${tag.id}</span>
                </div>
                
                <div class="tag-details">
                    <div class="detail-item">
                        <span class="detail-label">Slug:</span>
                        ${tag.slug}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Product Count:</span>
                        <span class="count-badge">${count}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Description:</span>
                    ${description}
                </div>

                <div class="json-data">
                    <strong>Raw Data:</strong>
                    <pre>${JSON.stringify(tag, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    private formatMultipleTags(tags: any[]): string {
        const tableRows = tags.map((tag) => `
            <tr>
                <td>${tag.id}</td>
                <td><strong>${tag.name}</strong></td>
                <td><code>${tag.slug}</code></td>
                <td><span class="count-badge">${tag.count || 0}</span></td>
                <td>${tag.description || "No description"}</td>
            </tr>
        `).join("");

        return `
            <div class="metadata">
                <strong>Total Tags:</strong> ${tags.length}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Products</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <div class="json-data">
                <strong>Raw Data:</strong>
                <pre>${JSON.stringify(tags, null, 2)}</pre>
            </div>
        `;
    }

    private generateSuccessPage(
        message: string,
        data: any,
        operation: string,
    ): Response {
        const content = `
            <div class="status success">${message}</div>
            <h2>Operation: ${operation}</h2>
            ${this.formatTagsForDisplay(Array.isArray(data) ? data : [data])}
        `;

        return this.generateHtmlResponse(
            `Success - ${operation}`,
            content,
            200,
        );
    }

    private generateErrorPage(
        message: string,
        error: any,
        operation: string,
    ): Response {
        const content = `
            <div class="status error">Error: ${message}</div>
            <h2>Failed Operation: ${operation}</h2>
            <div class="json-data">
                <strong>Error Details:</strong>
                <pre>${
            JSON.stringify({ error: error.message || error }, null, 2)
        }</pre>
            </div>
        `;

        return this.generateHtmlResponse(
            `Error - ${operation}`,
            content,
            500,
        );
    }

    // Core API methods (implementing abstract methods from Controller)
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("ProductTagsWEB GET", { id });

        try {
            if (id) {
                const tag = await WooProductTags.getProductTag(parseInt(id));
                return this.generateSuccessPage(
                    "Tag retrieved successfully",
                    tag,
                    "Get Tag",
                );
            } else {
                // Parse query parameters for filtering
                const url = req ? new URL(req.url) : null;
                const search = url?.searchParams.get("search");
                const limit = url?.searchParams.get("limit");
                const hideEmpty =
                    url?.searchParams.get("hide_empty") === "true";

                let tags;
                if (search) {
                    tags = await WooProductTags.searchProductTags(search);
                } else if (hideEmpty) {
                    tags = await WooProductTags.getTagsWithProducts();
                } else {
                    const queryParams: any = {};
                    if (limit) {
                        queryParams.per_page = parseInt(limit);
                    }
                    tags = await WooProductTags.getProductTags(queryParams);
                }

                return this.generateSuccessPage(
                    "Tags retrieved successfully",
                    tags,
                    "Get Tags",
                );
            }
        } catch (error) {
            console.error("Error in ProductTagsWEB GET:", error);
            return this.generateErrorPage(
                "Failed to retrieve tags",
                error,
                "Get Tags",
            );
        }
    }

    override async post(
        data: ProductTagData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsWEB POST", { data });

        try {
            const tagData = {
                name: data.name,
                slug: data.slug,
                description: data.description,
            };

            const createdTag = await WooProductTags.createProductTag(tagData);
            return this.generateSuccessPage(
                "Tag created successfully",
                createdTag,
                "Create Tag",
            );
        } catch (error) {
            console.error("Error in ProductTagsWEB POST:", error);
            return this.generateErrorPage(
                "Failed to create tag",
                error,
                "Create Tag",
            );
        }
    }

    override async put(
        id: string,
        data: ProductTagData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsWEB PUT", { id, data });

        try {
            if (!id || isNaN(parseInt(id))) {
                return this.generateErrorPage(
                    "Valid tag ID is required",
                    { error: "Invalid ID" },
                    "Update Tag",
                );
            }

            const tagData = {
                name: data.name,
                slug: data.slug,
                description: data.description,
            };

            const updatedTag = await WooProductTags.updateProductTag(
                parseInt(id),
                tagData,
            );
            return this.generateSuccessPage(
                "Tag updated successfully",
                updatedTag,
                "Update Tag",
            );
        } catch (error) {
            console.error("Error in ProductTagsWEB PUT:", error);
            return this.generateErrorPage(
                "Failed to update tag",
                error,
                "Update Tag",
            );
        }
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        this.logAction("ProductTagsWEB DELETE", { id });

        try {
            if (!id || isNaN(parseInt(id))) {
                return this.generateErrorPage(
                    "Valid tag ID is required",
                    { error: "Invalid ID" },
                    "Delete Tag",
                );
            }

            const force = req &&
                new URL(req.url).searchParams.get("force") === "true";
            const deletedTag = await WooProductTags.deleteProductTag(
                parseInt(id),
                force,
            );
            return this.generateSuccessPage(
                "Tag deleted successfully",
                deletedTag,
                "Delete Tag",
            );
        } catch (error) {
            console.error("Error in ProductTagsWEB DELETE:", error);
            return this.generateErrorPage(
                "Failed to delete tag",
                error,
                "Delete Tag",
            );
        }
    }

    // Additional web methods
    async getMostPopular(limit: number = 10, req?: Request): Promise<Response> {
        this.logAction("ProductTagsWEB GET_POPULAR", { limit });

        try {
            const tags = await WooProductTags.getMostPopularProductTags(limit);
            return this.generateSuccessPage(
                "Most popular tags retrieved successfully",
                tags,
                "Get Popular Tags",
            );
        } catch (error) {
            console.error("Error in ProductTagsWEB GET_POPULAR:", error);
            return this.generateErrorPage(
                "Failed to retrieve popular tags",
                error,
                "Get Popular Tags",
            );
        }
    }

    async searchTags(searchTerm: string, req?: Request): Promise<Response> {
        this.logAction("ProductTagsWEB SEARCH", { searchTerm });

        try {
            const tags = await WooProductTags.searchProductTags(searchTerm);
            return this.generateSuccessPage(
                `Search completed for "${searchTerm}"`,
                tags,
                "Search Tags",
            );
        } catch (error) {
            console.error("Error in ProductTagsWEB SEARCH:", error);
            return this.generateErrorPage(
                "Failed to search tags",
                error,
                "Search Tags",
            );
        }
    }

    async getTagsForProduct(
        productId: string,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsWEB GET_FOR_PRODUCT", { productId });

        try {
            if (!productId || isNaN(parseInt(productId))) {
                return this.generateErrorPage(
                    "Valid product ID is required",
                    { error: "Invalid product ID" },
                    "Get Product Tags",
                );
            }

            const tags = await WooProductTags.getProductTagsForProduct(
                parseInt(productId),
            );
            return this.generateSuccessPage(
                `Tags for product ${productId} retrieved successfully`,
                tags,
                "Get Product Tags",
            );
        } catch (error) {
            console.error("Error in ProductTagsWEB GET_FOR_PRODUCT:", error);
            return this.generateErrorPage(
                "Failed to retrieve product tags",
                error,
                "Get Product Tags",
            );
        }
    }
}
