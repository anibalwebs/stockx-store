import { Inter } from 'next/font/google'
import './globals.css' // Ajusta esta ruta según la ubicación de tu archivo
import { Toaster } from 'sonner' //

// Configuramos la fuente Inter (muy usada en paneles modernos)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Esta variable conecta directamente con tu globals.css
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Inyectamos la variable de la fuente en la etiqueta html
    <html lang="es" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
        <Toaster position="top-center" richColors /> 
      </body>
    </html>
  )
}