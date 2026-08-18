import { createClient } from '@/lib/supabase/server'
import { createProduct } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('id, name')
  const { data: brands } = await supabase.from('brands').select('id, name')

  // Array de tallas comunes para generar los checkboxes
  const commonSizes = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Producto</h1>
        <Link href="/admin/products">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form action={createProduct} className="space-y-8 bg-white p-6 border rounded-lg shadow-sm">
        
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">Nombre del Producto</Label>
          <Input id="title" name="title" required placeholder="Ej: Nike Air Max 90" />
        </div>

        {/* Precios */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="base_price">Precio Regular (USD $)</Label>
            <Input id="base_price" name="base_price" type="number" step="0.01" required placeholder="120.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale_price">Precio de Oferta / Descuento (Opcional)</Label>
            <Input id="sale_price" name="sale_price" type="number" step="0.01" placeholder="99.99" />
          </div>
        </div>

        {/* Clasificación Principal */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category_id">Categoría Principal</Label>
            <Select name="category_id" required>
              <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_id">Marca</Label>
            <Select name="brand_id" required>
              <SelectTrigger><SelectValue placeholder="Selecciona una marca" /></SelectTrigger>
              <SelectContent>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subcategorías (Género y Tipo) */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select name="gender" required>
              <SelectTrigger><SelectValue placeholder="Selecciona el género" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Caballero">Caballero</SelectItem>
                <SelectItem value="Dama">Dama</SelectItem>
                <SelectItem value="Unisex">Unisex</SelectItem>
                <SelectItem value="Niños">Niños</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_type">Tipo de Estilo</Label>
            <Select name="product_type" required>
              <SelectTrigger><SelectValue placeholder="Selecciona un estilo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Deportivo">Deportivo</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Elegante">Elegante / Formal</SelectItem>
                <SelectItem value="Botas">Botas</SelectItem>
                <SelectItem value="Sandalias">Sandalias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tallas con Checkboxes */}
        <div className="space-y-3">
          <Label>Tallas Disponibles (Selecciona las que apliquen)</Label>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
            {commonSizes.map((size) => (
              <label key={size} className="flex items-center justify-center space-x-2 border border-zinc-200 p-2 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:bg-black has-[:checked]:text-white transition-colors">
                <input type="checkbox" name="sizes" value={size} className="hidden" />
                <span className="font-medium">{size}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-zinc-500">Se mostrarán en la web solo para preguntar disponibilidad. No se llevará conteo exacto.</p>
        </div>

        {/* Imagen Principal */}
        <div className="space-y-2">
          <Label htmlFor="image">Imagen del Producto</Label>
          <Input id="image" name="image" type="file" accept="image/*" required className="cursor-pointer" />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" name="description" rows={4} placeholder="Escribe los detalles, materiales o cuidados del producto..." />
        </div>

        {/* Botón Anti-Doble Clic */}
        <SubmitButton />

      </form>
    </div>
  )
}