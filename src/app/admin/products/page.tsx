'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Delete, X, Edit2, Search, ImageIcon, Tag, LayoutGrid, Package, Percent, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getProductsList, verifyAndUpdateProductStatus } from './new/actions' // Ajusta la ruta de importación si es distinta

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados para el Modal del PIN
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string, isActive: boolean, statusName: string } | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  // Filtro de búsqueda en tiempo real
  useEffect(() => {
    const term = searchQuery.toLowerCase()
    const filtered = products.filter(p => 
      p.title?.toLowerCase().includes(term) ||
      p.brands?.name?.toLowerCase().includes(term) ||
      p.base_price?.toString().includes(term)
    )
    setFilteredProducts(filtered)
    setCurrentPage(1) // Regresar a la página 1 al buscar
  }, [searchQuery, products])

  // Auto-submit cuando el PIN llega a 6
  useEffect(() => {
    if (pin.length === 6 && pendingUpdate) {
      confirmStatusChange()
    }
  }, [pin, pendingUpdate])

  const fetchProducts = async () => {
    setIsLoading(true)
    const data = await getProductsList()
    setProducts(data)
    setFilteredProducts(data)
    setIsLoading(false)
  }

  const handleStatusSelect = (productId: string, value: string) => {
    const isActive = value === 'true'
    setPendingUpdate({ 
      id: productId, 
      isActive,
      statusName: isActive ? 'Activo' : 'Oculto'
    })
    setPin('')
    setPinError('')
    setIsModalOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!pendingUpdate) return
    setIsVerifying(true)
    setPinError('')

    const result = await verifyAndUpdateProductStatus(pendingUpdate.id, pendingUpdate.isActive, pin)

    if (result.success) {
      setProducts(products.map(p => 
        p.id === pendingUpdate.id ? { ...p, is_active: pendingUpdate.isActive } : p
      ))
      closeModal()
    } else {
      setPinError(result.error || 'Error desconocido')
      setPin('')
    }
    setIsVerifying(false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPendingUpdate(null)
    setPin('')
    setPinError('')
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 6 && !isVerifying) setPin(prev => prev + num)
  }

  const handleDelete = () => {
    if (!isVerifying) setPin(prev => prev.slice(0, -1))
  }

  // Helper para obtener la imagen principal
  const getPrimaryImage = (product: any) => {
    if (!product.product_images || product.product_images.length === 0) return null;
    const primary = product.product_images.find((img: any) => img.is_primary);
    return primary ? primary.image_url : product.product_images[0].image_url;
  }

  // Métricas para las tarjetas superiores
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const saleProducts = products.filter(p => p.sale_price && p.sale_price < p.base_price).length

  // Lógica de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-100 text-zinc-400 gap-3">
      <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      <p className="font-medium text-sm">Cargando catálogo...</p>
    </div>
  )

  return (
    <div className="space-y-6 md:space-y-8 relative pb-12">
      
      {/* HEADER TÍTULO */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Productos</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gestiona tu catálogo, precios e inventario.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {/* Tarjeta Catálogo Total */}
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center mb-3">
            <Package className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-zinc-900">{totalProducts}</span>
          </div>
          <span className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Total Catálogo</span>
        </div>

        {/* Tarjeta Activos */}
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-zinc-900">{activeProducts}</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Activos</span>
          </div>
          <span className="text-xs md:text-sm text-zinc-500 font-medium mt-1">En Tienda</span>
        </div>

        {/* Tarjeta Ofertas (Oculta en móvil pequeño si prefieres, aquí se muestra en 2 cols y luego 3) */}
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-3">
            <Percent className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-zinc-900">{saleProducts}</span>
            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Ofertas</span>
          </div>
          <span className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Con descuento</span>
        </div>
      </div>

      {/* BUSCADOR Y BOTÓN NUEVO */}
      <div className="flex flex-col sm:flex-row gap-3 w-full items-center bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <Input 
            placeholder="Buscar por nombre, marca o precio..." 
            className="pl-9 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="hidden sm:block w-px h-6 bg-zinc-200 mx-2"></div>
        <Link href="/admin/products/new" className="w-full sm:w-auto shrink-0">
          <Button className="w-full font-semibold bg-black text-white hover:bg-zinc-800 rounded-xl h-10 px-6 shadow-md transition-all">
            + Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* ESTADO VACÍO */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 border-dashed">
          <LayoutGrid className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
          <h3 className="text-lg font-bold text-zinc-900">No se encontraron productos</h3>
          <p className="text-zinc-500 text-sm mt-1">Intenta con otro término de búsqueda o agrega uno nuevo.</p>
        </div>
      )}

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedProducts.map((product) => {
          const imageUrl = getPrimaryImage(product)
          const isOnSale = product.sale_price && product.sale_price < product.base_price

          return (
            <div key={product.id} className="bg-white border border-zinc-200 p-3 rounded-2xl shadow-sm flex flex-col gap-4 relative overflow-hidden">
              {isOnSale && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                  OFERTA
                </div>
              )}

              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-zinc-50 border border-zinc-100 shrink-0 overflow-hidden flex items-center justify-center relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-zinc-300" />
                  )}
                </div>

                <div className="flex flex-col justify-center py-1 flex-1">
                  <h3 className="font-bold text-zinc-900 text-sm leading-tight line-clamp-2 pr-12">{product.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-500">
                    <Tag className="w-3 h-3" />
                    <span className="font-medium">{product.brands?.name || 'S/M'}</span>
                    <span className="text-zinc-300">•</span>
                    <span>{product.categories?.name || 'S/C'}</span>
                  </div>
                  
                  <div className="mt-2.5 flex items-baseline gap-2">
                    {isOnSale ? (
                      <>
                        <span className="font-black text-lg text-zinc-900">${product.sale_price}</span>
                        <span className="text-xs font-medium text-zinc-400 line-through">${product.base_price}</span>
                      </>
                    ) : (
                      <span className="font-black text-lg text-zinc-900">${product.base_price}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
                <div className="relative flex-1">
                  <select 
                    value={product.is_active ? 'true' : 'false'}
                    onChange={(e) => handleStatusSelect(product.id, e.target.value)}
                    className={`w-full text-xs font-bold rounded-xl p-2.5 outline-none appearance-none text-center border transition-colors ${
                      product.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}
                  >
                    <option value="true">Activo en Tienda</option>
                    <option value="false">Oculto</option>
                  </select>
                </div>
                
                <Link href={`/admin/products/${product.id}/edit`} className="flex-[0.8]">
                  <Button variant="outline" className="w-full text-xs h-9.5 rounded-xl gap-2 text-zinc-700 border-zinc-200 hover:bg-zinc-50">
                    <Edit2 size={14} /> Editar
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* VISTA DESKTOP (Tabla) */}
      <div className="hidden md:block bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50/50 border-b border-zinc-200 text-xs uppercase font-bold text-zinc-500">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Categoría / Marca</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paginatedProducts.map((product) => {
              const imageUrl = getPrimaryImage(product)
              const isOnSale = product.sale_price && product.sale_price < product.base_price

              return (
                <tr key={product.id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-zinc-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 group-hover:text-black transition-colors">
                          {product.title}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">{product.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-zinc-700">{product.categories?.name || 'N/A'}</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {product.brands?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isOnSale ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-900">${product.sale_price}</span>
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">Oferta</span>
                        </div>
                        <span className="text-xs font-medium text-zinc-400 line-through">${product.base_price}</span>
                      </div>
                    ) : (
                      <span className="font-black text-zinc-900">${product.base_price}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={product.is_active ? 'true' : 'false'}
                      onChange={(e) => handleStatusSelect(product.id, e.target.value)}
                      className={`text-xs font-bold rounded-lg px-3 py-1.5 outline-none appearance-none cursor-pointer border transition-colors ${
                        product.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100' 
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                      }`}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Oculto</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm" className="font-semibold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg h-9">
                        <Edit2 className="w-4 h-4 mr-2" /> Editar
                      </Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-zinc-200 p-3 rounded-2xl shadow-sm mt-4">
          <p className="text-xs font-medium text-zinc-500 ml-2 hidden sm:block">
            Mostrando <span className="font-bold text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-bold text-zinc-900">{filteredProducts.length}</span> productos
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-xl h-9 px-3 border-zinc-200 text-zinc-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <span className="text-xs font-bold text-zinc-700 sm:hidden">
              {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl h-9 px-3 border-zinc-200 text-zinc-600 disabled:opacity-50"
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE SEGURIDAD PIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-zinc-900 mb-1">Autorizar Acción</h3>
            <p className="text-sm text-zinc-500 mb-8 text-center">
              Ingresa el PIN para cambiar el estado del producto a <br/>
              <span className="font-bold text-zinc-800">"{pendingUpdate?.statusName}"</span>
            </p>

            <div className="flex gap-3 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-zinc-900 scale-110' : 'bg-zinc-200'}`} />
              ))}
            </div>

            {pinError && <p className="text-red-500 font-medium mb-4 text-sm animate-pulse">{pinError}</p>}
            {isVerifying && <p className="text-zinc-500 font-medium mb-4 text-sm">Validando...</p>}

            <div className="grid grid-cols-3 gap-x-8 gap-y-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  className="w-14 h-14 mx-auto rounded-full text-xl font-semibold text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleNumberClick('0')}
                className="w-14 h-14 mx-auto rounded-full text-xl font-semibold text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-14 h-14 mx-auto rounded-full text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}