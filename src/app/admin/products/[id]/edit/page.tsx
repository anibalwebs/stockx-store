import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '../../new/ProductForm'
import { getProductById } from '../../new/actions'
import { notFound } from 'next/navigation'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  // Desempaquetamos la promesa params obligatoria en Next.js 15+
  const { id } = await params

  const supabase = await createClient()
  const product = await getProductById(id)
  
  if (!product) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
      <ProductForm 
        categories={categories || []} 
        brands={brands || []} 
        initialData={product} 
      />
    </div>
  )
}