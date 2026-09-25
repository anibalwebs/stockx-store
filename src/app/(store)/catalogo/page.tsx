import { createClient } from '@/lib/supabase/server'
import CatalogClient from '@/components/CatalogClient'

export const metadata = {
  title: 'Catálogo | StockX',
  description: 'Explora nuestra colección completa de calzado, ropa y accesorios.',
}

export default async function CatalogoPage() {
  const supabase = await createClient()

  // Obtenemos las marcas y categorías para los filtros del sidebar
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <CatalogClient 
        initialBrands={brands || []} 
        initialCategories={categories || []} 
      />
    </div>
  )
}