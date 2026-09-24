'use client'

import { useEffect, useState } from 'react'
import { getOrders } from '@/actions/admin-orders'
import { verifyAndUpdateOrderStatus } from '@/actions/admin'
import { 
  Delete, 
  X, 
  Truck, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  XCircle,
  PackageCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

// --- Opciones de Estado con Íconos ---
const STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
  { value: 'Confirmado', label: 'Confirmado', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: 'Cancelado', label: 'Cancelado', icon: <XCircle className="w-3.5 h-3.5 text-rose-500" /> }
]

// --- Componente Custom para el Selector de Estado con Íconos ---
function StatusDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const current = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[0]

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center justify-between gap-2 bg-white border border-zinc-200 text-zinc-800 text-xs font-bold rounded-xl px-3 py-2 outline-none hover:bg-zinc-50 transition-colors shadow-sm"
      >
        <span className="flex items-center gap-1.5">
          {current.icon}
          {current.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-20 mt-1 w-36 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors border-b border-zinc-100 last:border-0"
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados para Búsqueda y Paginación
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados para el Modal del PIN
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string, status: string } | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  // Auto-submit cuando el PIN llega a 6 dígitos
  useEffect(() => {
    if (pin.length === 6 && pendingUpdate) {
      confirmStatusChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  // Resetear a la página 1 cuando se busca
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const fetchOrders = async () => {
    setIsLoading(true)
    const data = await getOrders()
    setOrders(data)
    setIsLoading(false)
  }

  const handleStatusSelect = (orderId: string, newStatus: string) => {
    setPendingUpdate({ id: orderId, status: newStatus })
    setPin('')
    setPinError('')
    setIsModalOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!pendingUpdate) return
    setIsVerifying(true)
    setPinError('')

    const result = await verifyAndUpdateOrderStatus(pendingUpdate.id, pendingUpdate.status, pin)

    if (result.success) {
      setOrders(orders.map(order => 
        order.id === pendingUpdate.id ? { ...order, status: pendingUpdate.status } : order
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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Confirmado': 
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmado
          </span>
        )
      case 'Cancelado': 
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelado
          </span>
        )
      default: 
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendiente
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-VE', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    })
  }

  // --- Lógica de Filtrado y Paginación ---
  const filteredOrders = orders.filter(order => 
    order.short_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
        <PackageCheck className="w-8 h-8 animate-bounce" />
        <p className="text-sm font-medium">Cargando pedidos...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-12 px-3 sm:px-6">
      
      {/* Cabecera de Página y Buscador */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-100 sm:border-zinc-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <PackageCheck className="text-zinc-400 w-6 h-6 sm:w-7 sm:h-7" />
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            Administra los pedidos entrantes desde el carrito hacia WhatsApp.
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Buscar código (Ej: PED-ABCD)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* =========================================================
          1. VISTA MÓVIL (Tarjetas)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-3.5 lg:hidden">
        {currentOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm space-y-3.5">
            
            {/* Fila Superior: Código + Selector de Estado */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Código</span>
                <p className="font-black text-zinc-900 text-base leading-tight">{order.short_id}</p>
              </div>
              <StatusDropdown 
                value={order.status} 
                onChange={(newStatus) => handleStatusSelect(order.id, newStatus)} 
              />
            </div>

            {/* Fila Secundaria: Método de Pago y Tipo de Envío */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100/80 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-zinc-500" /> Pago
                </span>
                <span className="text-xs font-bold text-zinc-800 mt-1 truncate">
                  {order.payment_method || 'Por definir'}
                </span>
              </div>
              <div className="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100/80 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                  <Truck className="w-3 h-3 text-zinc-500" /> Entrega
                </span>
                <span className="text-xs font-bold text-zinc-800 mt-1 truncate">
                  {order.delivery_method || 'Por definir'}
                </span>
              </div>
            </div>

            {/* Desglose de Productos */}
            <div className="bg-zinc-50/60 rounded-xl p-3 border border-zinc-100 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-zinc-400" /> Productos ({order.order_items?.length || 0})
              </span>
              <div className="divide-y divide-zinc-200/40">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <span className="text-zinc-700 font-medium truncate pr-2">
                      <span className="font-extrabold text-zinc-900">{item.quantity}x</span> {item.title}
                      <span className="text-zinc-400 text-[11px] ml-1.5">(Talla: {item.size})</span>
                    </span>
                    {item.price && (
                      <span className="font-bold text-zinc-900 shrink-0">
                        ${(item.price * item.quantity).toFixed(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fila Inferior: Fecha + Total */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total</span>
                <span className="text-lg font-black text-zinc-900 leading-none">${order.total_amount}</span>
              </div>
            </div>
          </div>
        ))}

        {!currentOrders.length && (
          <div className="bg-white rounded-2xl p-8 text-center text-zinc-400 border border-zinc-200">
            No se encontraron pedidos.
          </div>
        )}
      </div>

      {/* =========================================================
          2. VISTA DESKTOP (Tabla)
      ========================================================= */}
      <div className="hidden lg:block bg-white border border-zinc-200/80 rounded-3xl shadow-sm overflow-visible">
        <div className="overflow-x-visible">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Código / Fecha</th>
                <th className="px-6 py-4">Pago & Entrega</th>
                <th className="px-6 py-4">Productos</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                  
                  {/* Código & Fecha */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col">
                      <span className="font-black text-zinc-900 text-base">{order.short_id}</span>
                      <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {formatDate(order.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Pago & Entrega */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-35" title={order.payment_method}>
                          {order.payment_method || 'Por definir'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                        <Truck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-35" title={order.delivery_method}>
                          {order.delivery_method || 'Por definir'}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Lista de Productos */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      {order.order_items?.map((item: any) => (
                        <span key={item.id} className="text-xs text-zinc-700 font-medium">
                          <strong className="text-zinc-900">{item.quantity}x</strong> {item.title} 
                          <span className="text-zinc-400 ml-1">(Talla: {item.size})</span>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 align-top">
                    <span className="font-black text-zinc-900 text-base">${order.total_amount}</span>
                  </td>

                  {/* Estado Badge */}
                  <td className="px-6 py-4 align-top">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* Selector de Estado con Íconos (Custom Component) */}
                  <td className="px-6 py-4 align-top text-right">
                    <StatusDropdown 
                      value={order.status} 
                      onChange={(newStatus) => handleStatusSelect(order.id, newStatus)} 
                    />
                  </td>
                </tr>
              ))}
              {!currentOrders.length && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400 font-medium">
                    No se encontraron pedidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          3. CONTROLES DE PAGINACIÓN
      ========================================================= */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4 sm:pt-6">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-black disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-xs sm:text-sm font-black text-zinc-500">
            {currentPage} <span className="font-medium mx-1">de</span> {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-black disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================
          4. MODAL DE SEGURIDAD CON PIN
      ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
            
            <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 mt-2 sm:mt-0">Autorizar Acción</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8 text-center leading-relaxed">
              Ingresa tu PIN de seguridad para cambiar el estado a <br/>
              <span className="font-bold text-zinc-800">"{pendingUpdate?.status}"</span>
            </p>

            {/* Indicadores de PIN */}
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

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  disabled={isVerifying}
                  onClick={() => handleNumberClick(num.toString())}
                  className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full text-lg sm:text-xl font-semibold text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                disabled={isVerifying}
                onClick={() => handleNumberClick('0')}
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full text-lg sm:text-xl font-semibold text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200 disabled:opacity-50"
              >
                0
              </button>
              <button
                disabled={isVerifying}
                onClick={handleDelete}
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors active:bg-zinc-200 disabled:opacity-50"
              >
                <Delete className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-700" /> 
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}