import { Field, FieldValue, ProductDesign } from "./models/productDesign.ts";

class SupabaseField {
    public static populateFieldValues(values: FieldValue[], productDesign: ProductDesign[]): any {
        const fieldsToProcess: Field[] = [];
        
        productDesign.forEach((design: ProductDesign) => {
          design.fields.forEach((field: Field) => {
            const matchingValue = values.find((value: FieldValue) => value.field_id === field.field_id);
            if (matchingValue) {
              field.value = matchingValue.value;
              field.valid = false;
              field.error = { status: false, message: null };
              fieldsToProcess.push(field);
            }
          });
        });
        return fieldsToProcess;
      }
}

export { SupabaseField };