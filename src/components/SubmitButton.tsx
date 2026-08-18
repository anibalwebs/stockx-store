'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full font-bold">
      {pending ? 'Guardando producto (no cierres esta ventana)...' : 'Guardar Producto'}
    </Button>
  )
}