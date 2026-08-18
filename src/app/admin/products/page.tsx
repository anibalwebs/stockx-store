import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function ProductsPage() {
  const supabase = await createClient()
  
  // Consultamos los productos e incluimos el nombre de su categoría y marca
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name ),
      brands ( name )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-zinc-500 mt-2">Gestiona tu catálogo, precios e inventario.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="font-semibold">+ Nuevo Producto</Button>
        </Link>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Precio Base</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell>{product.categories?.name || 'N/A'}</TableCell>
                <TableCell>{product.brands?.name || 'N/A'}</TableCell>
                <TableCell>${product.base_price}</TableCell>
                <TableCell>
                  {product.is_active ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 hover:bg-zinc-100">Oculto</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm">Editar</Button>
                </TableCell>
              </TableRow>
            ))}
            {!products?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  No tienes productos registrados aún. Haz clic en &quot;Nuevo Producto&quot; para empezar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}