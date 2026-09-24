import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  ShoppingCart, 
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  Plus,
  CheckCircle2,
  XCircle,
  Tag,
  ImageIcon,
  Sparkles,
  ChevronRight,
  BarChart3
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Realizamos consultas en paralelo para obtener métricas completas
  const [
    { count: totalProducts },
    { count: activeProducts },
    { data: recentProducts },
    { data: orders }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products')
      .select('id, title, base_price, is_active, product_images(image_url, is_primary)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('orders')
      .select('id, short_id, total_amount, status, created_at')
      .order('created_at', { ascending: false })
  ])

  // --- CÁLCULO DE ESTADÍSTICAS ---
  const validOrders = orders || []
  
  const confirmedOrders = validOrders.filter(o => o.status === 'Confirmado')
  const pendingOrders = validOrders.filter(o => o.status === 'Pendiente')
  const cancelledOrders = validOrders.filter(o => o.status === 'Cancelado')

  const totalRevenue = confirmedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const pendingRevenue = pendingOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

  const totalOrdersCount = validOrders.length
  const pendingOrdersCount = pendingOrders.length
  const confirmedOrdersCount = confirmedOrders.length
  const cancelledOrdersCount = cancelledOrders.length

  const successRate = totalOrdersCount > 0 
    ? Math.round((confirmedOrdersCount / totalOrdersCount) * 100) 
    : 0

  const activeProductsPct = (totalProducts && totalProducts > 0)
    ? Math.round(((activeProducts || 0) / totalProducts) * 100)
    : 0

  const recentOrders = validOrders.slice(0, 6)

  // Estados dinámicos para el Banner de Salud del Catálogo
  const catalogHealthText = activeProductsPct >= 80 ? "Óptimo" : activeProductsPct >= 50 ? "Estable" : "Bajo"
  const catalogHealthColor = activeProductsPct >= 80 ? "text-emerald-400 bg-emerald-400/10" : activeProductsPct >= 50 ? "text-amber-400 bg-amber-400/10" : "text-red-400 bg-red-400/10"
  const catalogBarColor = activeProductsPct >= 80 ? "bg-emerald-400" : activeProductsPct >= 50 ? "bg-amber-400" : "bg-red-400"
  const catalogIconColor = activeProductsPct >= 80 ? "text-emerald-400" : activeProductsPct >= 50 ? "text-amber-400" : "text-red-400"

  // Helper para imagen principal
  const getPrimaryImage = (product: any) => {
    if (!product.product_images || product.product_images.length === 0) return null
    const primary = product.product_images.find((img: any) => img.is_primary)
    return primary ? primary.image_url : product.product_images[0].image_url
  }

  // Helper de badge de estado
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pendiente': 
        return <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Pendiente</span>
      case 'Confirmado': 
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Confirmado</span>
      case 'Cancelado': 
        return <span className="bg-red-50 text-red-600 border border-red-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Cancelado</span>
      default: 
        return <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{status}</span>
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      
      {/* 1. CABECERA Y ACCIONES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Panel de Control</h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-500 mt-0.5">
            Resumen general de rendimiento, ventas y catálogo en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/admin/products/new">
            <button className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Nuevo Producto
            </button>
          </Link>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS CLAVE (4 GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        {/* Ingresos Confirmados */}
        <div className="bg-white border border-zinc-200/80 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Cobrado
            </span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900">${totalRevenue.toLocaleString()}</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">Ingresos Confirmados</p>
          </div>
        </div>

        {/* Dinero Por Cobrar */}
        <div className="bg-white border border-zinc-200/80 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Por verificar
            </span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900">${pendingRevenue.toLocaleString()}</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">Por Cobrar (Pendiente)</p>
          </div>
        </div>

        {/* Pedidos Pendientes */}
        <div className="bg-white border border-zinc-200/80 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {pendingOrdersCount} activos
            </span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900">{pendingOrdersCount}</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">Pedidos Pendientes</p>
          </div>
        </div>

        {/* Catálogo Total */}
        <div className="bg-white border border-zinc-200/80 p-4 md:p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-zinc-100 text-zinc-800 rounded-xl">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {activeProducts || 0} Activos
            </span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900">{totalProducts || 0}</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">Productos en Catálogo</p>
          </div>
        </div>

      </div>

      {/* 3. LAYOUT PRINCIPAL (2 COLUMNAS EN DESKTOP, 1 EN MÓVIL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (2/3 en Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Módulos de Estado de Pedidos (Barra visual de Salud de Ventas) */}
          <div className="bg-white border border-zinc-200/80 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-zinc-900 text-base">Estado de los Pedidos</h2>
                <p className="text-xs text-zinc-500">Distribución global de órdenes realizadas</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-zinc-900">{successRate}%</span>
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Efectividad</p>
              </div>
            </div>

            {/* Barra de Progreso Múltiple */}
            <div className="w-full h-3.5 bg-zinc-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 mb-4">
              <div 
                className="bg-emerald-500 h-full rounded-l-full transition-all" 
                style={{ width: `${totalOrdersCount > 0 ? (confirmedOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                title="Confirmados"
              />
              <div 
                className="bg-amber-400 h-full transition-all" 
                style={{ width: `${totalOrdersCount > 0 ? (pendingOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                title="Pendientes"
              />
              <div 
                className="bg-red-400 h-full rounded-r-full transition-all" 
                style={{ width: `${totalOrdersCount > 0 ? (cancelledOrdersCount / totalOrdersCount) * 100 : 0}%` }}
                title="Cancelados"
              />
            </div>

            {/* Leyenda de la Barra */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmados
                </span>
                <span className="text-xs font-black text-zinc-900 mt-0.5">{confirmedOrdersCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pendientes
                </span>
                <span className="text-xs font-black text-zinc-900 mt-0.5">{pendingOrdersCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> Cancelados
                </span>
                <span className="text-xs font-black text-zinc-900 mt-0.5">{cancelledOrdersCount}</span>
              </div>
            </div>
          </div>

          {/* Tabla de Últimos Pedidos */}
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-base">Últimos Pedidos</h2>
                  <p className="text-xs text-zinc-500">Actividad reciente de compras</p>
                </div>
              </div>
              <Link href="/admin/orders" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl">
                Gestionar todos <ArrowRight size={13} />
              </Link>
            </div>

            <div className="p-2 sm:p-4">
              {recentOrders && recentOrders.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-3 flex items-center justify-between hover:bg-zinc-50/80 rounded-2xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center font-bold text-xs text-zinc-700 shrink-0">
                          #{order.short_id?.slice(-4) || 'ORD'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{order.short_id}</p>
                          <p className="text-xs font-medium text-zinc-400">
                            {new Date(order.created_at).toLocaleDateString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-sm font-black text-zinc-900">${order.total_amount}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <ShoppingCart size={32} className="mx-auto opacity-40" />
                  <p className="text-sm font-medium">Aún no hay pedidos registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* BANNER HORIZONTAL DE SALUD DE CATÁLOGO (Movido a la izquierda para balancear visualmente) */}
          <div className="bg-linear-to-br from-zinc-900 to-zinc-950 text-white p-5 sm:p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="relative z-10 sm:max-w-[55%]">
              <div className="flex items-center gap-2 mb-2 text-zinc-300 text-xs font-bold uppercase tracking-wider">
                <BarChart3 size={16} className={catalogIconColor} /> 
                Rendimiento de Catálogo
              </div>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                El <strong className="text-white">{activeProductsPct}%</strong> de tus productos registrados están visibles en la tienda pública. Un catálogo activo y surtido mejora las conversiones.
              </p>
            </div>
            
            <div className="relative z-10 w-full sm:w-[38%] shrink-0">
              <div className="flex items-end justify-between mb-2">
                 <span className="text-3xl font-black leading-none">{activeProductsPct}%</span>
                 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${catalogHealthColor}`}>
                   {catalogHealthText}
                 </span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${catalogBarColor}`}
                  style={{ width: `${activeProductsPct}%` }}
                />
              </div>
            </div>

            {/* Icono decorativo de fondo */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none translate-x-4">
              <BarChart3 size={150} />
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (1/3 en Desktop) */}
        <div className="space-y-6">
          
          {/* ACCESOS RÁPIDOS */}
          <div className="bg-white border border-zinc-200/80 p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold text-zinc-900 text-sm mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-zinc-700" /> Accesos Rápidos
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/products/new" className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-2xl transition-all group flex flex-col justify-between">
                <Plus className="text-zinc-700 group-hover:scale-110 transition-transform mb-2" size={18} />
                <span className="text-xs font-bold text-zinc-800">Agregar Producto</span>
              </Link>
              <Link href="/admin/orders" className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-2xl transition-all group flex flex-col justify-between">
                <ShoppingCart className="text-zinc-700 group-hover:scale-110 transition-transform mb-2" size={18} />
                <span className="text-xs font-bold text-zinc-800">Ver Pedidos</span>
              </Link>
              <Link href="/admin/categories" className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-2xl transition-all group flex flex-col justify-between">
                <Tag className="text-zinc-700 group-hover:scale-110 transition-transform mb-2" size={18} />
                <span className="text-xs font-bold text-zinc-800">Categorías</span>
              </Link>
              <Link href="/admin/products" className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-2xl transition-all group flex flex-col justify-between">
                <Package className="text-zinc-700 group-hover:scale-110 transition-transform mb-2" size={18} />
                <span className="text-xs font-bold text-zinc-800">Ver Catálogo</span>
              </Link>
            </div>
          </div>

          {/* CATÁLOGO RECIENTE CON THUMBNAILS */}
          <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-sm overflow-hidden p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-zinc-900 text-sm">Catálogo Reciente</h2>
                <p className="text-[11px] text-zinc-500">Últimos agregados</p>
              </div>
              <Link href="/admin/products" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                Ver todos <ChevronRight size={14} />
              </Link>
            </div>

            {recentProducts && recentProducts.length > 0 ? (
              <div className="space-y-3">
                {recentProducts.map((product) => {
                  const imageUrl = getPrimaryImage(product)
                  return (
                    <div key={product.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-zinc-300" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-zinc-900 truncate">{product.title}</p>
                          <p className="text-xs font-black text-zinc-600 mt-0.5">${product.base_price}</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {product.is_active ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Activo</span>
                        ) : (
                          <span className="bg-zinc-100 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Oculto</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400">
                <Package size={28} className="mx-auto opacity-40 mb-1" />
                <p className="text-xs">No hay productos recientes</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}