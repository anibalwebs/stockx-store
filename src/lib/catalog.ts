import type { SupabaseClient } from '@supabase/supabase-js'

export type CatalogProduct = {
  id: string
  title: string
  slug: string
  base_price: number
  sale_price: number | null
  gender: string
  product_type: string
  product_images: { image_url: string; is_primary: boolean }[]
  brands: { name: string } | null
}

export type CatalogFilters = {
  searchTerm: string
  brands: string[]
  categories: string[]
  genders: string[]
  styles: string[]
  min: string
  max: string
}

export const CATALOG_PAGE_SIZE = 8

// Identical projection, filters and pagination for SSR and browser updates.
export function catalogQuery(supabase: SupabaseClient, filters: CatalogFilters, page: number, signal?: AbortSignal) {
  let query = supabase.from('products').select(`
    id, title, slug, base_price, sale_price, gender, product_type,
    brands ( name ), product_images ( image_url, is_primary )
  `, { count: 'exact' }).eq('is_active', true)

  if (filters.searchTerm) query = query.ilike('title', `%${filters.searchTerm}%`)
  const brands = filters.brands.filter(brand => brand !== 'null_brand')
  const hasNullBrand = filters.brands.includes('null_brand')
  if (brands.length && hasNullBrand) query = query.or(`brand_id.in.(${brands.join(',')}),brand_id.is.null`)
  else if (brands.length) query = query.in('brand_id', brands)
  else if (hasNullBrand) query = query.is('brand_id', null)
  if (filters.categories.length) query = query.in('category_id', filters.categories)
  if (filters.genders.length) query = query.in('gender', filters.genders)
  if (filters.styles.length) query = query.in('product_type', filters.styles)
  if (filters.min) query = query.gte('base_price', filters.min)
  if (filters.max) query = query.lte('base_price', filters.max)

  const from = (page - 1) * CATALOG_PAGE_SIZE
  query = query.range(from, from + CATALOG_PAGE_SIZE - 1).order('created_at', { ascending: false })
  return signal ? query.abortSignal(signal) : query
}

export function catalogQueryKey(filters: CatalogFilters, page: number) {
  return JSON.stringify([page, filters.searchTerm, filters.brands, filters.categories, filters.genders, filters.styles, filters.min, filters.max])
}
