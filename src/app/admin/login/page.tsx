'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginAdmin } from '@/actions/auth'

// --- ICONOS SVG (Sin dependencias externas) ---
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>

export default function AdminLoginPage() {
  const router = useRouter()
  
  // Estados de flujo
  const [step, setStep] = useState<'email' | 'pin'>('email')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // 1. Manejo del paso del correo
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.')
      return
    }
    
    // Quitar el foco del input para que el teclado deje de escribir en él
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    
    setStep('pin')
  }

  // 2. Lógica para capturar teclas numéricas del teclado físico
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (step !== 'pin' || isLoading || isSuccess) return

    if (e.key >= '0' && e.key <= '9') {
      if (pin.length < 6) {
        setPin(prev => prev + e.key)
      }
    } else if (e.key === 'Backspace') {
      setPin(prev => prev.slice(0, -1))
    }
  }, [step, pin, isLoading, isSuccess])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 3. Procesar el PIN automáticamente al llegar a 6 dígitos
  useEffect(() => {
    if (pin.length === 6) {
      processLogin()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const processLogin = async () => {
    setIsLoading(true)
    setError(null)

    const result = await loginAdmin(email, pin)

    if (result.success) {
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/admin/orders') 
      }, 1000)
    } else {
      setError(result.error || 'Error desconocido')
      setPin('') 
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white font-sans">
      
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-950 text-white p-12">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors w-fit">
          <ArrowLeftIcon /> Volver a la Tienda
        </Link>

        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="font-bold text-xl tracking-tight">StockX Admin</span>
          </div>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Panel exclusivo protegido por PIN. Ingresa tus credenciales corporativas para acceder al sistema.
          </p>
        </div>

        <div className="text-zinc-600 text-sm font-medium">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        
        <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <ArrowLeftIcon /> Tienda
        </Link>

        <div className="w-full max-w-sm space-y-8">
          
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              {step === 'email' ? 'Ingresa tu correo' : 'Ingresa tu PIN'}
            </h2>
            <p className="text-zinc-500 text-sm">
              {step === 'email' 
                ? 'Ingresa correo de administrador para continuar.' 
                : 'Digita tu clave numérica de 6 dígitos.'}
            </p>
          </div>

          <div className="relative overflow-hidden min-h-125">
            
            {/* VISTA 1: CORREO */}
            <div className={`absolute w-full transition-all duration-500 transform ${step === 'email' ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-12 opacity-0 pointer-events-none'}`}>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MailIcon />
                  </div>
                  {/* SOLUCIÓN: Cambiado focus:border-transparent a focus:border-black focus:ring-1 para eliminar el conflicto de esquinas transparentes */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="tu@correo.com"
                    className="w-full pl-11 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                    required
                  />
                </div>

                {error && step === 'email' && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium animate-in fade-in zoom-in-95">
                    <AlertIcon /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10 flex justify-center items-center h-14"
                >
                  Continuar
                </button>
                
                {/* SOLUCIÓN: Espacio rellenado con información de seguridad sutil para balancear la altura */}
                <div className="pt-6 mt-4 flex flex-col items-center gap-3 border-t border-zinc-100/0">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                    <LockIcon /> Área restringida. Conexión cifrada.
                  </div>
                  <p className="text-zinc-400/80 text-[11px] text-center px-4 leading-relaxed">
                    Area permitida solo para personal autorizado, en caso de olvidar tus credenciales, contacta al administrador del sistema.
                  </p>
                </div>
                <div className="mt-6 p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-4 shadow-sm">
                  
                  {/* Encabezado del estado de red */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-semibold text-zinc-800">Sistemas Activos</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded-md font-medium">v2.4.1</span>
                  </div>

                  {/* Lista de características de seguridad */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-zinc-800">Conexión Cifrada (TLS 1.3)</p>
                        <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">Tus credenciales viajan protegidas mediante encriptación de grado bancario.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-zinc-800">Auditoría en Tiempo Real</p>
                        <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">Cada intento de acceso registra IP y dispositivo por motivos de seguridad.</p>
                      </div>
                    </div>
                  </div>

                  {/* Enlaces de pie de tarjeta */}
                  <div className="pt-3 border-t border-zinc-200/80 flex items-center justify-between text-xs font-medium text-zinc-600">
                    <button type="button" className="hover:text-black transition-colors flex items-center gap-1.5">
                      <LockIcon /> Olvidé mi PIN
                    </button>
                    <button type="button" className="hover:text-black transition-colors underline decoration-zinc-300 underline-offset-4">
                      Soporte de TI
                    </button>
                  </div>

                </div>
              </form>
            </div>

            {/* VISTA 2: PIN */}
            <div className={`absolute w-full transition-all duration-500 transform ${step === 'pin' ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
              
              <div className="flex items-center justify-center gap-2 mb-8 text-sm">
                <span className="text-zinc-900 font-medium px-3 py-1 bg-zinc-100 rounded-full truncate max-w-50">
                  {email}
                </span>
                <button 
                  onClick={() => { setStep('email'); setPin(''); setError(null) }}
                  className="text-zinc-400 hover:text-black transition-colors underline decoration-zinc-300 underline-offset-4 shrink-0"
                >
                  Cambiar
                </button>
              </div>
                
              <div className="flex justify-center gap-3 mb-10">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      pin.length > i 
                        ? 'bg-black scale-110 shadow-md' 
                        : 'bg-zinc-200'
                    }`}
                  />
                ))}
              </div>
                  
              {error && step === 'pin' && (
                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium mb-6 animate-in zoom-in-95 text-center">
                  <AlertIcon /> {error}
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg text-sm font-bold mb-6 animate-in zoom-in-95">
                  <div className="bg-green-500 rounded-full p-1"><CheckIcon /></div>
                  Redirigiendo...
                </div>
              )}
              

              <div className={`grid grid-cols-3 gap-4 max-w-70 mx-auto transition-opacity ${isLoading || isSuccess ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => pin.length < 6 && setPin(prev => prev + num)}
                    className="h-16 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-2xl font-semibold text-zinc-800 transition-colors active:scale-95 flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                
                <div />
                
                <button
                  onClick={() => pin.length < 6 && setPin(prev => prev + '0')}
                  className="h-16 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-2xl font-semibold text-zinc-800 transition-colors active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                
                <button
                  onClick={() => setPin(prev => prev.slice(0, -1))}
                  className="h-16 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-50 transition-colors active:scale-95 flex items-center justify-center"
                  title="Borrar"
                >
                  <DeleteIcon />
                </button>
              </div>
              

              <div className="text-center mt-8 text-xs text-zinc-400 font-medium">
                Puedes utilizar el teclado numérico de tu computadora.
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}