'use client'

import { useState } from 'react'
import { addCategory, addBrand, toggleCategory, toggleBrand, deleteCategory, deleteBrand } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tags, Star, Plus, Layers, FolderTree, Hash, Sparkles, X, Delete, Trash2, Power } from 'lucide-react'

type EntityType = 'categoría' | 'marca'

type PendingAction = 
  | { type: 'add', entity: EntityType, name: string }
  | { type: 'toggle', entity: EntityType, id: string, name: string, isActive: boolean }
  | { type: 'delete', entity: EntityType, id: string, name: string }

export function CategoriesClient({ categories, brands }: { categories: any[], brands: any[] }) {
  const [categoryName, setCategoryName] = useState('')
  const [brandName, setBrandName] = useState('')

  // Estados del Modal Universal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const triggerAction = (action: PendingAction) => {
    setPendingAction(action)
    setPin('')
    setPinError(null)
    setIsModalOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent, entity: EntityType, name: string) => {
    e.preventDefault()
    if (!name.trim()) return
    triggerAction({ type: 'add', entity, name })
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPendingAction(null)
    setPin('')
    setPinError(null)
  }

  const verifyAndSubmit = async (enteredPin: string) => {
    if (!pendingAction) return
    
    setIsVerifying(true)
    setPinError(null)

    let result: any

    try {
      if (pendingAction.type === 'add') {
        const formData = new FormData()
        formData.append('name', pendingAction.name)
        formData.append('pin', enteredPin)
        result = pendingAction.entity === 'categoría' ? await addCategory(formData) : await addBrand(formData)
      } 
      else if (pendingAction.type === 'toggle') {
        result = pendingAction.entity === 'categoría'
          ? await toggleCategory(pendingAction.id, pendingAction.isActive, enteredPin)
          : await toggleBrand(pendingAction.id, pendingAction.isActive, enteredPin)
      } 
      else if (pendingAction.type === 'delete') {
        result = pendingAction.entity === 'categoría'
          ? await deleteCategory(pendingAction.id, enteredPin)
          : await deleteBrand(pendingAction.id, enteredPin)
      }
    } catch (error) {
      result = { error: 'Error inesperado del servidor' }
    }

    setIsVerifying(false)

    if (result?.error) {
      setPinError(result.error)
      setPin('') 
    } else {
      closeModal()
      if (pendingAction.type === 'add') {
        pendingAction.entity === 'categoría' ? setCategoryName('') : setBrandName('')
      }
    }
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 6 && !isVerifying) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 6) verifyAndSubmit(newPin)
    }
  }

  const handleDeletePinChar = () => {
    if (!isVerifying) {
      setPin(prev => prev.slice(0, -1))
      setPinError(null)
    }
  }

  const getActionText = () => {
    if (!pendingAction) return ''
    if (pendingAction.type === 'add') return `agregar la ${pendingAction.entity}`
    if (pendingAction.type === 'toggle') return `${pendingAction.isActive ? 'deshabilitar' : 'habilitar'} la ${pendingAction.entity}`
    if (pendingAction.type === 'delete') return `eliminar permanentemente la ${pendingAction.entity}`
    return ''
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-8 pb-12 px-3 sm:px-6">
      
      {/* Cabecera */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-100 sm:border-zinc-200/80 shadow-sm flex flex-col gap-1.5 sm:gap-2">
        <h1 className="text-xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5 sm:gap-3">
          <FolderTree className="text-zinc-400 w-6 h-6 sm:w-7 sm:h-7" />
          Categorías & Marcas
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
          Gestiona las clasificaciones de tus productos. Requiere PIN de administrador para realizar modificaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        
        {/* =======================================
            COLUMNA DE CATEGORÍAS 
        ======================================= */}
        <div className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-zinc-100 sm:border-zinc-200/80 shadow-sm space-y-5 flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 sm:pb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Layers className="text-indigo-600 w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-800">Categorías</h2>
          </div>

          {/* Formulario en una sola línea incluso en móvil */}
          <form onSubmit={(e) => handleAddSubmit(e, 'categoría', categoryName)} className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <Input 
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ej: Zapatos, Ropa..." 
                className="pl-9 sm:pl-11 h-11 sm:h-12 rounded-xl bg-zinc-50/80 border-zinc-200 focus-visible:ring-indigo-500 transition-all text-sm font-medium" 
              />
            </div>
            <Button type="submit" disabled={!categoryName.trim()} className="h-11 sm:h-12 px-4 sm:px-6 rounded-xl gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md shrink-0">
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> 
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </form>
          
          <div className="border border-zinc-100 sm:border-zinc-200/80 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-sm flex-1">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-zinc-600 h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm">Info</TableHead>
                  <TableHead className="font-semibold text-zinc-600 h-10 sm:h-12 px-3 sm:px-4 w-22.5 sm:w-25 text-right text-xs sm:text-sm">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="p-3 sm:p-4">
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <span className="font-bold text-zinc-800 flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                          {cat.name}
                          {!cat.is_active && <span className="text-[9px] sm:text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-semibold">Inactiva</span>}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-zinc-400">
                          <Hash size={12} /> {cat.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-4 align-middle">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button 
                          onClick={() => triggerAction({ type: 'toggle', entity: 'categoría', id: cat.id, name: cat.name, isActive: cat.is_active !== false })}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${cat.is_active !== false ? 'text-green-600 hover:bg-green-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                          title={cat.is_active !== false ? 'Deshabilitar' : 'Habilitar'}
                        >
                          <Power className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                        <button 
                          onClick={() => triggerAction({ type: 'delete', entity: 'categoría', id: cat.id, name: cat.name })}
                          className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!categories?.length && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-zinc-400 font-medium text-xs sm:text-sm">
                      Aún no hay categorías registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* =======================================
            COLUMNA DE MARCAS 
        ======================================= */}
        <div className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-zinc-100 sm:border-zinc-200/80 shadow-sm space-y-5 flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 sm:pb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Sparkles className="text-amber-600 w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-800">Marcas</h2>
          </div>

          {/* Formulario en una sola línea incluso en móvil */}
          <form onSubmit={(e) => handleAddSubmit(e, 'marca', brandName)} className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <Input 
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ej: Nike, Adidas..." 
                className="pl-9 sm:pl-11 h-11 sm:h-12 rounded-xl bg-zinc-50/80 border-zinc-200 focus-visible:ring-amber-500 transition-all text-sm font-medium" 
              />
            </div>
            <Button type="submit" disabled={!brandName.trim()} className="h-11 sm:h-12 px-4 sm:px-6 rounded-xl gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md shrink-0">
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> 
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </form>
          
          <div className="border border-zinc-100 sm:border-zinc-200/80 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-sm flex-1">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-zinc-600 h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm">Info</TableHead>
                  <TableHead className="font-semibold text-zinc-600 h-10 sm:h-12 px-3 sm:px-4 w-22.5 sm:w-25 text-right text-xs sm:text-sm">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands?.map((brand) => (
                  <TableRow key={brand.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="p-3 sm:p-4">
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <span className="font-bold text-zinc-800 flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                          {brand.name}
                          {!brand.is_active && <span className="text-[9px] sm:text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-semibold">Inactiva</span>}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-zinc-400">
                          <Hash size={12} /> {brand.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-4 align-middle">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button 
                          onClick={() => triggerAction({ type: 'toggle', entity: 'marca', id: brand.id, name: brand.name, isActive: brand.is_active !== false })}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${brand.is_active !== false ? 'text-green-600 hover:bg-green-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                          title={brand.is_active !== false ? 'Deshabilitar' : 'Habilitar'}
                        >
                          <Power className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                        <button 
                          onClick={() => triggerAction({ type: 'delete', entity: 'marca', id: brand.id, name: brand.name })}
                          className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!brands?.length && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-zinc-400 font-medium text-xs sm:text-sm">
                      Aún no hay marcas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* MODAL DE SEGURIDAD PIN UNIVERSAL */}
      {isModalOpen && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
            
            <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 mt-2 sm:mt-0">Autorizar Acción</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8 text-center leading-relaxed">
              Ingresa tu PIN de seguridad para {getActionText()}: <br/>
              <span className={`font-bold text-sm sm:text-base ${pendingAction.type === 'delete' ? 'text-red-500' : 'text-zinc-800'}`}>
                "{pendingAction.name}"
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
                onClick={handleDeletePinChar}
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