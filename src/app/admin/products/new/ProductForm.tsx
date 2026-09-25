'use client'

import { useState, useEffect, useRef } from 'react'
import { createProduct, updateProduct, deleteProduct } from './actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { 
  Package, DollarSign, Tag, Shirt, Ruler, 
  ImageIcon, FileText, Info, ArrowLeft, LayoutList, AlertCircle, X, Delete, Eye, Plus, Star, Trash2
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

type ImageItem = {
  id: string
  type: 'existing' | 'new'
  url?: string
  file?: File
  previewUrl?: string
}

export function ProductForm({ categories, brands, initialData }: { categories: any[], brands: any[], initialData?: any }) {
  const router = useRouter()
  const isEdit = !!initialData
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitialSizeCategory = (): SizeCategory => {
    if (!initialData || !initialData.product_variants || initialData.product_variants.length === 0) return 'calzado'
    const firstSize = initialData.product_variants[0].size
    for (const [key, sizes] of Object.entries(sizeOptions)) {
      if (sizes.includes(firstSize)) return key as SizeCategory
    }
    return 'calzado'
  }

  const getInitialImages = (): ImageItem[] => {
    if (!initialData?.product_images || initialData.product_images.length === 0) return []
    // Ordenar para que la principal esté de primera
    const sorted = [...initialData.product_images].sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    return sorted.map((img: any) => ({
      id: img.id || Math.random().toString(36).substring(2, 9),
      type: 'existing',
      url: img.image_url
    }))
  }

  const [sizeCategory, setSizeCategory] = useState<SizeCategory>(getInitialSizeCategory())
  const [images, setImages] = useState<ImageItem[]>(getInitialImages())
  const [imageError, setImageError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados Modal PIN
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pinAction, setPinAction] = useState<'update' | 'delete' | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const initialSizes = isEdit ? initialData.product_variants.map((v: any) => v.size) : []

  useEffect(() => {
    // Verificamos que el PIN esté completo y haya una acción definida
    if (pin.length === 6 && pinAction) {
      // Si la acción es actualizar, exigimos que exista el formulario pendiente
      if (pinAction === 'update' && !pendingFormData) return;
      
      // Ejecutamos la confirmación (ya sea update o delete)
      confirmAction();
    }
  }, [pin, pinAction, pendingFormData])

  // Manejo de carga de archivos (Mín. 0, Máx. 4)
  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setImageError(null)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const maxSize = 3 * 1024 * 1024 // 3 MB

    const fileArray = Array.from(files)
    const validFiles: File[] = []

    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        setImageError('Solo se permiten imágenes en formato .png, .jpg o .webp')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      if (file.size > maxSize) {
        setImageError(`La imagen "${file.name}" supera el límite de 3 MB.`)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      validFiles.push(file)
    }

    if (images.length + validFiles.length > 4) {
      setImageError('Solo puedes agregar un máximo de 4 imágenes por producto.')
    }

    const remainingSlots = 4 - images.length
    const filesToAdd = validFiles.slice(0, remainingSlots)

    const newItems: ImageItem[] = filesToAdd.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      type: 'new',
      file,
      previewUrl: URL.createObjectURL(file)
    }))

    setImages(prev => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Establecer una imagen como principal (mover al índice 0)
  const makePrimary = (index: number) => {
    if (index === 0) return
    setImages(prev => {
      const updated = [...prev]
      const [selected] = updated.splice(index, 1)
      return [selected, ...updated]
    })
  }

  // Eliminar imagen
  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev]
      const removed = updated.splice(index, 1)[0]
      if (removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setImageError(null)

    const formElement = e.currentTarget
    const formData = new FormData(formElement)

    formData.delete('images')
    formData.delete('images_meta')

    // Construir la metadata y adjuntar los archivos de imagen
    const imagesMeta: Array<{ type: 'existing' | 'new', url?: string, fileIndex?: number }> = []
    let fileIndex = 0

    images.forEach(img => {
      if (img.type === 'existing' && img.url) {
        imagesMeta.push({ type: 'existing', url: img.url })
      } else if (img.type === 'new' && img.file) {
        imagesMeta.push({ type: 'new', fileIndex })
        formData.append('images', img.file)
        fileIndex++
      }
    })

    formData.append('images_meta', JSON.stringify(imagesMeta))

    if (isEdit) {
      setPendingFormData(formData)
      setPinAction('update') // Especificamos que la acción es actualizar
      setIsModalOpen(true)
    } else {
      setIsSubmitting(true)
      try {
        await createProduct(formData)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDeleteRequest = () => {
    setPinAction('delete') // Especificamos que la acción es eliminar
    setIsModalOpen(true)
  }

  const confirmAction = async () => {
    if (!initialData) return
    setIsVerifying(true)
    setPinError('')

    let result;

    if (pinAction === 'update' && pendingFormData) {
      result = await updateProduct(initialData.id, pendingFormData, pin)
    } else if (pinAction === 'delete') {
      result = await deleteProduct(initialData.id, pin)
    } else {
      return
    }

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
    setPinAction(null)
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
      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
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

            {/* BLOQUE DE FOTOGRAFÍAS MULTI-IMAGEN (Mín 0, Máx 4) */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-800">
                  <ImageIcon size={16} className="text-zinc-400" /> Fotografías ({images.length}/4)
                </h2>
                <span className="text-[11px] text-zinc-400 font-medium">Mín. 0 - Máx. 4</span>
              </div>
              
              <p className="text-xs text-zinc-500 leading-relaxed">
                La <strong>primera imagen</strong> agregada será la principal. Puedes cambiar la imagen principal haciendo clic en la estrella.
              </p>

              {/* Grid de imágenes seleccionadas */}
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 group bg-zinc-50">
                    <img 
                      src={img.url || img.previewUrl} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Badge de Imagen Principal vs Secundaria */}
                    {idx === 0 ? (
                      <div className="absolute top-2 left-2 bg-black text-white text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-md z-10">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" /> Principal
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makePrimary(idx)}
                        className="absolute top-2 left-2 bg-white/90 hover:bg-black hover:text-white text-zinc-700 text-[9px] font-bold px-2 py-1 rounded-md transition-colors shadow-sm flex items-center gap-1 z-10 opacity-90 group-hover:opacity-100"
                        title="Convertir en imagen principal"
                      >
                        <Star size={10} /> Principal
                      </button>
                    )}

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md transition-colors shadow-sm z-10"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Botón de Agregar Foto si hay menos de 4 */}
                {images.length < 4 && (
                  <label className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-100/50 rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-600">
                      <Plus size={18} />
                    </div>
                    <span className="text-xs font-bold text-zinc-600">Agregar foto</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".png, .jpg, .jpeg, .webp" 
                      multiple
                      onChange={handleFilesAdded}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {imageError && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 pt-1">
                  <AlertCircle size={14} /> {imageError}
                </p>
              )}

              <p className="text-[11px] text-zinc-400">
                Formatos permitidos: .png, .jpg, .webp (Máx. 3 MB por foto)
              </p>
            </div>

            {/* Botón Guardar */}
            {/* Botones de Acción */}
            <div className="pt-2 space-y-3">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-black hover:bg-zinc-800 disabled:opacity-50 transition-all font-bold text-white shadow-lg shadow-black/10 flex items-center justify-center"
              >
                {isSubmitting ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Producto')}
              </button>

              {isEdit && (
                <button 
                  type="button"
                  onClick={handleDeleteRequest}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50 transition-all font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Eliminar Producto
                </button>
              )}
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

            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 mt-2 sm:mt-0">
              {pinAction === 'delete' ? 'Eliminar Producto' : 'Autorizar Acción'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8 text-center leading-relaxed">
              Ingresa tu PIN de seguridad para {pinAction === 'delete' ? 'eliminar permanentemente' : 'guardar los cambios de'}: <br/>
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