export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  price: number | null;
  sku: string | null;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  base_price: number;
  category_id: string | null;
  brand_id: string | null;
  is_active: boolean;
  created_at: string;
  
  // Relaciones opcionales para cuando hagamos consultas con JOINs
  categories?: Category;
  brands?: Brand;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
}