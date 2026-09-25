import Link from 'next/link'
import Image from 'next/image' // Importamos Image de next

// Íconos SVG directos (mismo diseño de lucide-react)
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
)

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
)

const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
    <path d="M12 18h.01"></path>
  </svg>
)

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-zinc-100 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Contenedor Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          
          {/* Columna 1: Logo y Descripción */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image 
                src="/logo.png" 
                alt="StockX Logo" 
                width={140} 
                height={45} 
                className="object-contain h-8 md:h-10 w-auto"
                priority={false}
              />
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Llevando el mejor estilo y comodidad a tus pies. Calzado original con envíos a nivel nacional.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="space-y-6">
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">
              Atención al Cliente
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors font-medium">
                  Envíos y Entregas
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors font-medium">
                  Cambios y Devoluciones
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors font-medium">
                  Métodos de Pago
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 text-sm transition-colors font-medium">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Redes y Contacto */}
          <div className="space-y-6">
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">
              Conecta con nosotros
            </h4>
            <div className="flex items-center gap-3">
              <a href="#" className="w-11 h-11 bg-zinc-50 hover:bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 hover:border-zinc-300">
                <InstagramIcon />
              </a>
              <a href="#" className="w-11 h-11 bg-zinc-50 hover:bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 hover:border-zinc-300">
                <FacebookIcon />
              </a>
              <a href="https://wa.me/584121234567" target="_blank" rel="noreferrer" className="w-11 h-11 bg-zinc-50 hover:bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 hover:border-zinc-300">
                <SmartphoneIcon />
              </a>
            </div>
            <p className="text-zinc-500 text-sm font-medium pt-1">
              WhatsApp: +58 412-1234567
            </p>
          </div>
        </div>

        {/* Sección Inferior: Copyright */}
        <div className="border-t border-zinc-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-400 text-xs font-medium text-center md:text-left">
            © {currentYear} StockX - Todos los derechos reservados.
          </p>
          <p className="text-zinc-400 text-xs font-medium text-center md:text-right">
            Powered by BePro
          </p>
        </div>
      </div>
    </footer>
  )
}