import { Field, FieldValue, ProductDesign } from "./models/productDesign.ts";
import { SupabaseClient } from "./supabaseClient.ts";

class SupabaseGateway {
    public static async getGateway(gateway_id: string, supabaseClient: SupabaseClient): Promise<any> {
        const { data, error } = await supabaseClient.from("gateways").select("*").eq("id", gateway_id).single();
        if (error) {
          console.error("Error getting gateway:", error);
          throw new Error(error.message);

        }
        return data;
      }

      public static async getGatewayByProductId(product_id: string, supabaseClient: SupabaseClient): Promise<any> {
        try {
          // Fetch the gateway_id from the products table using the product_id
          const { data: productData, error: productError } = await supabaseClient
            .from("products")
            .select("gateway_id")
            .eq("id", product_id)
            .single();
          
          if (productError) {
            console.error("Error getting product:", productError);
            throw new Error(productError.message);
          }
      
          const gateway_id = productData.gateway_id;
      
          // Fetch the gateway details using the gateway_id
          const { data: gatewayData, error: gatewayError } = await supabaseClient
            .from("gateways")
            .select("*")
            .eq("id", gateway_id)
            .single();
      
          if (gatewayError) {
            console.error("Error getting gateway:", gatewayError);
            throw new Error(gatewayError.message);
          }
      
          return gatewayData;
        } catch (error) {
          console.error("Error in getGatewayByProductId:", error);
          throw error;
        }
      }
      

      public static async callGatewayFunction(gateway: any, product_id: any, req: Request, fieldsToProcess: Field[], action: string): Promise<any> {
        const response = await fetch(
          `https://lklnughhxvtdbnmrdagz.supabase.co/functions/v1/${gateway.function_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `${req.headers.get("Authorization")}`,
            },
            body: JSON.stringify({
              values: [{ fields: fieldsToProcess }],
              action: action,
              product_id: product_id
            }),
          },
        );
    
        const gatewayFunctionResponse = await response.json();
        if (!response.ok) {
          console.error("Error calling gateway:", gatewayFunctionResponse.error);
          throw new Error(gatewayFunctionResponse.error);
        }
        return gatewayFunctionResponse;
      }

      public static processGatewayResponse(gatewayFunctionResponse: any, productDesign: ProductDesign[]): Field[] {
        const fieldsToReturn: Field[] = [];
        productDesign.forEach((design: ProductDesign) => {
          design.fields.forEach((field: Field) => {
            gatewayFunctionResponse.values[0].fields.forEach((processedField: Field) => {
              if (processedField.field_id === field.field_id) {
                fieldsToReturn.push(processedField);
              }
            });
            if (!fieldsToReturn.some((f) => f.field_id === field.field_id)) {
              field.valid = false;
              field.error = { status: false, message: null };
              fieldsToReturn.push(field);
            }
          });
        });

        return fieldsToReturn;
      }
    
}

export { SupabaseGateway };