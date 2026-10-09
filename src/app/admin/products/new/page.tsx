import { createClient } from '@/lib/supabase/server'
import { ProductForm } from './ProductForm'

export default async function NewProductPage() {
  const supabase = await createClient()
  
  // Carga de datos del servidor (Filtrando solo los activos y ordenando alfabéticamente)
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })
  ])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
      <ProductForm 
        categories={categories || []} 
        brands={brands || []} 
      />
    </div>
  )
}