import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from './CategoriesClient'

export default async function CategoriesPage() {
  const supabase = await createClient()
  
  const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: false })
  const { data: brands } = await supabase.from('brands').select('*').order('created_at', { ascending: false })

  return <CategoriesClient categories={categories || []} brands={brands || []} />
}