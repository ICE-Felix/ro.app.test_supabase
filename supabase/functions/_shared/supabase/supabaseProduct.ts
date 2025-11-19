import { Field, FieldValue, ProductDesign } from "./models/productDesign.ts";
import { SupabaseClient } from "./supabaseClient.ts";
import { SupabaseUser } from "./supabaseUser.ts";

class SupabaseProduct {

  public static async getProduct(product_id: string, supabaseClient: SupabaseClient): Promise<any> {
    const { data, error } = await supabaseClient.from("products").select("*").eq("id", product_id).single();
    if (error) {
      console.error("Error getting product:", error);
      throw new Error("Error getting product:" + error);
    }
    return data;
  }

  public static async getProductDesign(product_id: string, supabaseClient: SupabaseClient): Promise<any> {
    
    const { data, error } = await supabaseClient.rpc("get_products_designs", {
      uuid: product_id,
      checkout: false,
    });
    if (error) {
      console.error("Error getting product design:", error);
      throw new Error("Error getting product design:" + error);
    }
    return data;
  }

  public static async addProductToCart(product_id: string, values: FieldValue[], supabaseClient: SupabaseClient): Promise<any> {
    const user = await SupabaseUser.get(supabaseClient);
    const { data, error } = await supabaseClient.from("carts").insert({ product_id, values, user_id: user.id }).select().order("id", { ascending: false }).limit(1);

    if (error) {
      console.error("Error inserting into carts table:", error);
      throw new Error("Error inserting into carts table:" + error);

    } 
    console.log("Product added to cart:", data);
    return data[0].id;

  }

  public static updateProductDesignFields(productDesign: ProductDesign[], fieldsToReturn: Field[]): ProductDesign[] {
    return productDesign.map((design: ProductDesign) => {
      design.fields = fieldsToReturn;
      return design;
    });
  }
}

export { SupabaseProduct };
