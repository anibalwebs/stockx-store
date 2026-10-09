import { createClient } from '@/lib/supabase/server'
import { CategoriesClient } from './CategoriesClient'

export default async function CategoriesPage() {
  const supabase = await createClient()
  
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from('categories').select('*').order('created_at', { ascending: false }),
    supabase.from('brands').select('*').order('created_at', { ascending: false })
  ])

  return <CategoriesClient categories={categories || []} brands={brands || []} />
}