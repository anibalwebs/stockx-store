import { createClient } from '@/lib/supabase/server'
import CatalogClient from '@/components/CatalogClient'
import { catalogQuery, type CatalogFilters, type CatalogProduct } from '@/lib/catalog'

export const metadata = {
  title: 'Catálogo | StockX',
  description: 'Explora nuestra colección completa de calzado, ropa y accesorios.',
}

type SearchParams = Record<string, string | string[] | undefined>
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const params = await searchParams
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
  ])
  const category = first(params.categoria)
  const matchedCategory = categories?.find(c => c.id === category || c.name.toLowerCase() === category?.toLowerCase())
  const brand = first(params.marca)
  const gender = first(params.genero)
  const filters: CatalogFilters = {
    searchTerm: '', brands: brand ? [brand] : [],
    categories: category ? [matchedCategory?.id || category] : [],
    genders: gender ? [gender] : [], styles: [], min: '', max: '',
  }
  const { data, count, error } = await catalogQuery(supabase, filters, 1)
  return (
    <div className="min-h-screen bg-zinc-50/50">
      <CatalogClient
        initialBrands={brands || []}
        initialCategories={categories || []}
        initialFilters={filters}
        initialProducts={error ? null : data as unknown as CatalogProduct[]}
        initialCount={count || 0}
      />
    </div>
  )
}
