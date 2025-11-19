import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProductCategories } from "../../_shared/woo_commerce/products/wooProductCategories.ts";

// Define product category data interface
interface ProductCategoryData {
    id?: number;
    name: string;
    slug?: string;
    parent?: number;
    description?: string;
    display?: "default" | "products" | "subcategories" | "both";
    image?: {
        id?: number;
        src?: string;
        name?: string;
        alt?: string;
    };
    menu_order?: number;
    [key: string]: unknown;
}

export class ProductCategoriesWebController
    extends Controller<ProductCategoryData> {
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
                .category-card { 
                    border: 1px solid #ddd; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin: 15px 0; 
                    background: #f9f9f9;
                }
                .category-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 15px;
                }
                .category-name { 
                    font-size: 1.2em; 
                    font-weight: bold; 
                    color: #007cba;
                }
                .category-id { 
                    background: #007cba; 
                    color: white; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 0.9em;
                }
                .category-details { 
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
                .parent-info { 
                    background: #e7f3ff; 
                    padding: 10px; 
                    border-radius: 4px; 
                    border-left: 4px solid #007cba;
                }
                .hierarchy-level { 
                    margin-left: 20px; 
                    border-left: 2px solid #ddd; 
                    padding-left: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>WooCommerce Product Categories</h1>
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

    private formatCategoryCard(category: any, includeHierarchy = true): string {
        const parentInfo = category.parent > 0
            ? `
            <div class="parent-info">
                <strong>Parent Category:</strong> ID ${category.parent}
            </div>
        `
            : "";

        const imageInfo = category.image
            ? `
            <div class="detail-item">
                <span class="detail-label">Image:</span>
                <img src="${category.image.src}" alt="${
                category.image.alt || category.name
            }" style="max-width: 100px; height: auto;">
            </div>
        `
            : "";

        return `
            <div class="category-card">
                <div class="category-header">
                    <div class="category-name">${category.name}</div>
                    <div class="category-id">ID: ${category.id}</div>
                </div>
                
                ${parentInfo}
                
                <div class="category-details">
                    <div class="detail-item">
                        <span class="detail-label">Slug:</span>
                        ${category.slug}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Display:</span>
                        ${category.display}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Product Count:</span>
                        ${category.count}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Menu Order:</span>
                        ${category.menu_order}
                    </div>
                    ${imageInfo}
                </div>
                
                ${
            category.description
                ? `
                    <div class="detail-item">
                        <span class="detail-label">Description:</span>
                        ${category.description}
                    </div>
                `
                : ""
        }
            </div>
        `;
    }

    // Core API methods
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("ProductCategoriesWEB GET", { id });

        try {
            if (id) {
                const category = await WooProductCategories.getProductCategory(
                    parseInt(id),
                );
                const content = `
                    <h2>Category Details</h2>
                    ${this.formatCategoryCard(category)}
                    
                    <h2>Raw Data</h2>
                    <div class="json-data">
                        <pre>${JSON.stringify(category, null, 2)}</pre>
                    </div>
                `;
                return this.generateHtmlResponse(
                    `Category: ${category.name}`,
                    content,
                );
            } else {
                const categories = await WooProductCategories
                    .getProductCategories();
                const content = `
                    <h2>All Categories (${categories.length})</h2>
                    ${
                    categories.map((category) =>
                        this.formatCategoryCard(category)
                    ).join("")
                }
                    
                    <h2>Raw Data</h2>
                    <div class="json-data">
                        <pre>${JSON.stringify(categories, null, 2)}</pre>
                    </div>
                `;
                return this.generateHtmlResponse("Product Categories", content);
            }
        } catch (error) {
            console.error("Error in ProductCategoriesWEB GET:", error);
            const content = `
                <div class="status error">
                    <h2>Error</h2>
                    <p>Failed to retrieve categories: ${
                error instanceof Error ? error.message : "Unknown error"
            }</p>
                </div>
            `;
            return this.generateHtmlResponse("Error", content, 500);
        }
    }

    override async post(
        data: ProductCategoryData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductCategoriesWEB POST", { data });

        try {
            const createdCategory = await WooProductCategories
                .createProductCategory({
                    name: data.name,
                    slug: data.slug,
                    parent: data.parent || 0,
                    description: data.description || "",
                    display: data.display || "default",
                    image: data.image,
                    menu_order: data.menu_order || 0,
                });

            const content = `
                <div class="status success">
                    <h2>Success!</h2>
                    <p>Category created successfully</p>
                </div>
                
                <h2>Created Category</h2>
                ${this.formatCategoryCard(createdCategory)}
                
                <h2>Raw Data</h2>
                <div class="json-data">
                    <pre>${JSON.stringify(createdCategory, null, 2)}</pre>
                </div>
            `;
            return this.generateHtmlResponse("Category Created", content);
        } catch (error) {
            console.error("Error in ProductCategoriesWEB POST:", error);
            const content = `
                <div class="status error">
                    <h2>Error</h2>
                    <p>Failed to create category: ${
                error instanceof Error ? error.message : "Unknown error"
            }</p>
                </div>
                
                <h2>Attempted Data</h2>
                <div class="json-data">
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
            return this.generateHtmlResponse("Error", content, 500);
        }
    }

    override async put(
        id: string,
        data: ProductCategoryData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductCategoriesWEB PUT", { id, data });

        try {
            if (!id || isNaN(parseInt(id))) {
                const content = `
                    <div class="status error">
                        <h2>Error</h2>
                        <p>Valid category ID is required for updates</p>
                    </div>
                `;
                return this.generateHtmlResponse("Error", content, 400);
            }

            const updateData: any = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.slug !== undefined) updateData.slug = data.slug;
            if (data.parent !== undefined) updateData.parent = data.parent;
            if (data.description !== undefined) {
                updateData.description = data.description;
            }
            if (data.display !== undefined) updateData.display = data.display;
            if (data.image !== undefined) updateData.image = data.image;
            if (data.menu_order !== undefined) {
                updateData.menu_order = data.menu_order;
            }

            const updatedCategory = await WooProductCategories
                .updateProductCategory(parseInt(id), updateData);

            const content = `
                <div class="status success">
                    <h2>Success!</h2>
                    <p>Category updated successfully</p>
                </div>
                
                <h2>Updated Category</h2>
                ${this.formatCategoryCard(updatedCategory)}
                
                <h2>Raw Data</h2>
                <div class="json-data">
                    <pre>${JSON.stringify(updatedCategory, null, 2)}</pre>
                </div>
            `;
            return this.generateHtmlResponse("Category Updated", content);
        } catch (error) {
            console.error("Error in ProductCategoriesWEB PUT:", error);
            const content = `
                <div class="status error">
                    <h2>Error</h2>
                    <p>Failed to update category: ${
                error instanceof Error ? error.message : "Unknown error"
            }</p>
                </div>
                
                <h2>Attempted Data</h2>
                <div class="json-data">
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
            return this.generateHtmlResponse("Error", content, 500);
        }
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        this.logAction("ProductCategoriesWEB DELETE", { id });

        try {
            if (!id || isNaN(parseInt(id))) {
                const content = `
                    <div class="status error">
                        <h2>Error</h2>
                        <p>Valid category ID is required</p>
                    </div>
                `;
                return this.generateHtmlResponse("Error", content, 400);
            }

            const url = new URL(req!.url);
            const forceDelete = url.searchParams.get("force") === "true";

            const deletedCategory = await WooProductCategories
                .deleteProductCategory(parseInt(id), forceDelete);

            const content = `
                <div class="status success">
                    <h2>Success!</h2>
                    <p>Category deleted successfully</p>
                </div>
                
                <h2>Deleted Category</h2>
                ${this.formatCategoryCard(deletedCategory)}
                
                <h2>Raw Data</h2>
                <div class="json-data">
                    <pre>${JSON.stringify(deletedCategory, null, 2)}</pre>
                </div>
            `;
            return this.generateHtmlResponse("Category Deleted", content);
        } catch (error) {
            console.error("Error in ProductCategoriesWEB DELETE:", error);
            const content = `
                <div class="status error">
                    <h2>Error</h2>
                    <p>Failed to delete category: ${
                error instanceof Error ? error.message : "Unknown error"
            }</p>
                </div>
            `;
            return this.generateHtmlResponse("Error", content, 500);
        }
    }
}
