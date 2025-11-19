export interface Option {
    id: string;
    title: string;
    value: string | null;
    leading_info: string;
  }
  
export  interface Field {
    id: string;
    type: string;
    label: string;
    regex: string | null;
    online: boolean;
    options: Option[] | null;
    field_id: string;
    is_account: boolean;
    value?: string[] | string;
    valid?: boolean;
    error?: { status: boolean; message: string | null };
  }
  
 export  interface ProductDesign {
    id: string;
    product_id: string;
    product_name: string;
    fields: Field[];
  }

export type FieldValue = {
    field_id: string;
    value: string | string[];
  };