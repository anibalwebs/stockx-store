'use client'

import { useState, useEffect } from 'react'
import { createProduct, updateProduct } from './actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { 
  Package, DollarSign, Tag, Shirt, Ruler, 
  ImageIcon, FileText, Info, ArrowLeft, LayoutList, AlertCircle, X, Delete, Eye
} from 'lucide-react'

const sizeOptions = {
  calzado: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  ropa_superior: ["XS", "S", "M", "L", "XL", "XXL"],
  pantalon_hombre: ["28", "30", "32", "34", "36", "38", "40", "42"],
  pantalon_mujer: ["0", "2", "4", "6", "8", "10", "12", "14", "16"],
  ninos: ["2T", "3T", "4T", "6", "8", "10", "12", "14", "16"],
  unica: ["Talla Única"]
}

type SizeCategory = keyof typeof sizeOptions

export function ProductForm({ categories, brands, initialData }: { categories: any[], brands: any[], initialData?: any }) {
  const router = useRouter()
  const isEdit = !!initialData

  const getInitialSizeCategory = (): SizeCategory => {
    if (!initialData || !initialData.product_variants || initialData.product_variants.length === 0) return 'calzado'
    const firstSize = initialData.product_variants[0].size
    for (const [key, sizes] of Object.entries(sizeOptions)) {
      if (sizes.includes(firstSize)) return key as SizeCategory
    }
    return 'calzado'
  }

  const [sizeCategory, setSizeCategory] = useState<SizeCategory>(getInitialSizeCategory())
  const [imageError, setImageError] = useState<string | null>(null)
  
  // Estados Modal PIN
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const initialSizes = isEdit ? initialData.product_variants.map((v: any) => v.size) : []

  useEffect(() => {
    if (pin.length === 6 && pendingFormData) {
      confirmUpdate()
    }
  }, [pin, pendingFormData])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 3 * 1024 * 1024
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setImageError('Solo se permiten imágenes en formato .png, .jpg o .webp')
      e.target.value = ''
      return
    }

    if (file.size > maxSize) {
      setImageError('El archivo es demasiado grande. El peso máximo es de 3 MB.')
      e.target.value = ''
      return
    }

    setImageError(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isEdit) {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      setPendingFormData(formData)
      setIsModalOpen(true)
    }
  }

  const confirmUpdate = async () => {
    if (!pendingFormData || !initialData) return
    setIsVerifying(true)
    setPinError('')

    const result = await updateProduct(initialData.id, pendingFormData, pin)

    if (result.success) {
      closeModal()
      router.push('/admin/products')
      router.refresh()
    } else {
      setPinError(result.error || 'Error desconocido')
      setPin('')
      setIsVerifying(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPendingFormData(null)
    setPin('')
    setPinError('')
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 6 && !isVerifying) setPin(prev => prev + num)
  }

  const handleDeletePinChar = () => {
    if (!isVerifying) setPin(prev => prev.slice(0, -1))
  }

  return (
    <>
      <form action={isEdit ? undefined : createProduct} onSubmit={handleSubmit} className="space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Package className="text-zinc-400" /> {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">
              {isEdit ? 'Actualiza los datos y valida con tu PIN.' : 'Completa los datos para publicar en el catálogo.'}
            </p>
          </div>
          <Link href="/admin/products">
            <Button variant="outline" type="button" className="w-full sm:w-auto rounded-xl gap-2 h-11 px-5">
              <ArrowLeft size={16} /> Cancelar
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda (Principal) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información Principal */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800 border-b pb-3">
                <Info size={16} className="text-zinc-400" /> Información Principal
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-zinc-600">Nombre del Producto</Label>
                <Input id="title" name="title" defaultValue={initialData?.title} required placeholder="Ej: Nike Air Max 90" className="rounded-xl bg-zinc-50/50 h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-zinc-600 flex items-center gap-2">
                  <FileText size={14} /> Descripción
                </Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={initialData?.description}
                  rows={4} 
                  placeholder="Materiales, cuidados, características destacadas..." 
                  className="rounded-xl bg-zinc-50/50 resize-none"
                />
              </div>
            </div>

            {/* Precios y Clasificación */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800 border-b pb-3">
                <LayoutList size={16} className="text-zinc-400" /> Precios y Clasificación
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="base_price" className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                    <DollarSign size={14} /> Precio Regular
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                    <Input id="base_price" name="base_price" defaultValue={initialData?.base_price} type="number" step="0.01" required placeholder="0.00" className="pl-7 rounded-xl bg-zinc-50/50 h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price" className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <Tag size={14} /> Precio de Oferta (Opcional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-medium">$</span>
                    <Input id="sale_price" name="sale_price" defaultValue={initialData?.sale_price} type="number" step="0.01" placeholder="0.00" className="pl-7 rounded-xl bg-emerald-50/30 border-emerald-200 focus-visible:ring-emerald-400 h-11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-xs font-bold text-zinc-600">Categoría</Label>
                  <Select name="category_id" defaultValue={initialData?.category_id} required>
                    <SelectTrigger className="rounded-xl bg-zinc-50/50 h-11"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_id" className="text-xs font-bold text-zinc-600">Marca</Label>
                  <Select name="brand_id" defaultValue={initialData?.brand_id} required>
                    <SelectTrigger className="rounded-xl bg-zinc-50/50 h-11"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {brands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tallas Dinámicas */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800">
                  <Ruler size={16} className="text-zinc-400" /> Tallas Disponibles
                </h2>
                <div className="w-full sm:w-48">
                  <Select value={sizeCategory} onValueChange={(v) => setSizeCategory(v as SizeCategory)}>
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-zinc-100 border-none font-medium">
                      <SelectValue placeholder="Tipo de Talla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calzado">Calzado</SelectItem>
                      <SelectItem value="ropa_superior">Ropa (S, M, L)</SelectItem>
                      <SelectItem value="pantalon_hombre">Pantalón Hombre</SelectItem>
                      <SelectItem value="pantalon_mujer">Pantalón Mujer</SelectItem>
                      <SelectItem value="ninos">Niños</SelectItem>
                      <SelectItem value="unica">Talla Única</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={sizeCategory === 'unica' ? 'flex justify-start' : 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5'}>
                {sizeOptions[sizeCategory].map((size) => (
                  <label key={size} className={`relative cursor-pointer group ${sizeCategory === 'unica' ? 'w-full max-w-xs' : ''}`}>
                    <input 
                      type="checkbox" 
                      name="sizes" 
                      value={size} 
                      defaultChecked={initialSizes.includes(size)}
                      className="peer hidden" 
                    />
                    <div className="h-11 px-4 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 transition-all peer-checked:bg-black peer-checked:text-white peer-checked:border-black peer-hover:border-zinc-300 shadow-sm">
                      {size}
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Columna Derecha (Secundaria) */}
          <div className="space-y-6">
            
            {/* Bloque: Visibilidad/Estado del Producto */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800 border-b pb-3">
                <Eye size={16} className="text-zinc-400" /> Visibilidad en Catálogo
              </h2>
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-xs font-bold text-zinc-600">Estado del Producto</Label>
                <Select 
                  name="is_active" 
                  defaultValue={initialData?.is_active !== undefined ? String(initialData.is_active) : "true"}
                >
                  <SelectTrigger className="rounded-xl bg-zinc-50/50 h-11">
                    <SelectValue placeholder="Selecciona estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo (Visible en tienda)</SelectItem>
                    <SelectItem value="false">Inactivo (Oculto en tienda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Atributos extra */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800 border-b pb-3">
                <Shirt size={16} className="text-zinc-400" /> Atributos
              </h2>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-xs font-bold text-zinc-600">Género</Label>
                  <Select name="gender" defaultValue={initialData?.gender} required>
                    <SelectTrigger className="rounded-xl bg-zinc-50/50 h-11"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Caballero">Caballero</SelectItem>
                      <SelectItem value="Dama">Dama</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                      <SelectItem value="Niños">Niños</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="product_type" className="text-xs font-bold text-zinc-600">Estilo</Label>
                  <Select name="product_type" defaultValue={initialData?.product_type} required>
                    <SelectTrigger className="rounded-xl bg-zinc-50/50 h-11"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
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
            </div>

            {/* Fotografía */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800 border-b pb-3">
                <ImageIcon size={16} className="text-zinc-400" /> Fotografía
              </h2>
              
              <div className="space-y-4">
                {isEdit && initialData?.product_images?.[0]?.image_url && (
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-zinc-200 relative">
                    <img src={initialData.product_images[0].image_url} alt="Imagen actual" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md">Imagen Actual</div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-xs font-bold text-zinc-600">{isEdit ? 'Reemplazar Imagen (Opcional)' : 'Imagen Principal'}</Label>
                  <Input 
                    id="image" 
                    name="image" 
                    type="file" 
                    accept=".png, .jpg, .jpeg, .webp" 
                    onChange={handleImageChange}
                    required={!isEdit}
                    className="cursor-pointer file:bg-zinc-100 file:text-zinc-700 file:text-xs file:font-bold file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 rounded-xl bg-zinc-50/50 h-auto py-2.5" 
                  />
                  {imageError ? (
                    <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pt-1">
                      <AlertCircle size={14} /> {imageError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-400">Formatos permitidos: .png, .jpg, .webp (Máx. 3 MB)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full h-12 rounded-2xl bg-black hover:bg-zinc-800 transition-all font-bold text-white shadow-lg shadow-black/10 flex items-center justify-center"
              >
                {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>

          </div>
        </div>
      </form>

      {/* MODAL DE SEGURIDAD PIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
            
            <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 mt-2 sm:mt-0">Autorizar Acción</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8 text-center leading-relaxed">
              Ingresa tu PIN de seguridad para guardar los cambios de: <br/>
              <span className="font-bold text-sm sm:text-base text-zinc-800">
                "{initialData?.title}"
              </span>
            </p>

            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 ${
                    i < pin.length ? 'bg-zinc-900 scale-110 shadow-sm shadow-black/20' : 'bg-zinc-200'
                  }`} 
                />
              ))}
            </div>

            <div className="h-5 sm:h-6 mb-3 sm:mb-4 flex items-center justify-center w-full text-center">
              {pinError && <p className="text-red-500 font-bold text-xs sm:text-sm animate-pulse">{pinError}</p>}
              {isVerifying && <p className="text-zinc-500 font-medium text-xs sm:text-sm animate-pulse">Validando credenciales...</p>}
            </div>

            <div className="grid grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  disabled={isVerifying}
                  onClick={() => handleNumberClick(num.toString())}
                  type="button"
                  className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full text-lg sm:text-xl font-semibold text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                disabled={isVerifying}
                onClick={() => handleNumberClick('0')}
                type="button"
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full text-lg sm:text-xl font-semibold text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200 disabled:opacity-50"
              >
                0
              </button>
              <button
                disabled={isVerifying}
                onClick={handleDeletePinChar}
                type="button"
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200 disabled:opacity-50"
              >
                <Delete className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-700" /> 
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}