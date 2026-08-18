import { createClient } from '@/lib/supabase/server'
import { addCategory, addBrand } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function CategoriesPage() {
  const supabase = await createClient()
  
  // Consultar categorías y marcas actuales desde Supabase
  const { data: categories } = await supabase.from('categories').select('*').order('created_at', { ascending: false })
  const { data: brands } = await supabase.from('brands').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorías & Marcas</h1>
        <p className="text-zinc-500 mt-2">Gestiona las clasificaciones de tus productos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Columna de Categorías */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={addCategory} className="flex gap-2">
              <Input name="name" placeholder="Ej: Zapatos, Ropa, Accesorios..." required />
              <Button type="submit">Agregar</Button>
            </form>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-zinc-500">{category.slug}</TableCell>
                    </TableRow>
                  ))}
                  {!categories?.length && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-zinc-500">No hay categorías registradas</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Columna de Marcas */}
        <Card>
          <CardHeader>
            <CardTitle>Marcas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={addBrand} className="flex gap-2">
              <Input name="name" placeholder="Ej: Nike, Adidas, Jordan..." required />
              <Button type="submit">Agregar</Button>
            </form>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands?.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-zinc-500">{brand.slug}</TableCell>
                    </TableRow>
                  ))}
                  {!brands?.length && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-zinc-500">No hay marcas registradas</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}