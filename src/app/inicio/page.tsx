'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Star, Building2, ShoppingBag, Trophy, ClipboardList, UserCircle, LogOut, Inbox, Calendar, Award } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const banners = [
  { titulo: 'Noche de título', sub: 'Lima Boxing Arena · 26 jul', color: '#5a1414' },
  { titulo: 'Team Fuego Lima', sub: 'Primera clase gratis', color: '#1d3d33' },
  { titulo: 'Everlast Perú', sub: '20% dcto en guantes', color: '#3a2f10' },
  { titulo: 'Invita y sube', sub: '5 amigos = top of view', color: '#4a1414' },
]

const accesos = [
  { href: '/sparring', label: 'Buscar sparring', icon: Search },
  { href: '/solicitudes', label: 'Solicitudes', icon: Inbox },
  { href: '/entrenadores', label: 'Encuentra un entrenador', icon: Star },
  { href: '/escuelas', label: 'Escuelas cerca', icon: Building2 },
  { href: '/tienda', label: 'Tienda', icon: ShoppingBag },
  { href: '/eventos', label: 'Eventos', icon: Calendar },
  { href: '/ranking', label: 'Ranking Comunidad', icon: Trophy },
  { href: '/ranking-oficial', label: 'Ranking Oficial MMA', icon: Award },
  { href: '/mis-sparring', label: 'Mis sparring', icon: ClipboardList },
  { href: '/perfil', label: 'Mi perfil', icon: UserCircle },
]

const GAP_PX = 12
const AUTOPLAY_MS = 3500
const RESUME_AFTER_MS = 5000
const NOTIF_POLL_MS = 15000

export default function InicioPage() {
  const [cargando, setCargando] = useState(true)
  const [email, setEmail] = useState('')
  const [hayNotificacion, setHayNotificacion] = useState(false)
  const router = useRouter()

  const scrollRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const revisarNotificaciones = async (uid: string) => {
    const { count: countPendientes } = await supabase
      .from('solicitudes_sparring')
      .select('id', { count: 'exact', head: true })
      .eq('receptor_id', uid)
      .eq('estado', 'pendiente')

    const { count: countNoLeidos } = await supabase
      .from('solicitudes_sparring')
      .select('id', { count: 'exact', head: true })
      .or(`and(solicitante_id.eq.${uid},mensaje_no_leido_solicitante.eq.true),and(receptor_id.eq.${uid},mensaje_no_leido_receptor.eq.true)`)

    setHayNotificacion((countPendientes ?? 0) + (countNoLeidos ?? 0) > 0)
  }

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | null = null

    const iniciar = async () => {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        const uid = data.user.id
        setEmail(data.user.email ?? '')
        await revisarNotificaciones(uid)
        intervalo = setInterval(() => revisarNotificaciones(uid), NOTIF_POLL_MS)
      }
      // Sin usuario: no redirige. /inicio se puede explorar como invitado.

      setCargando(false)
    }
    iniciar()

    return () => {
      if (intervalo) clearInterval(intervalo)
    }
  }, [])

  const avanzarCarrusel = () => {
    const el = scrollRef.current
    if (!el) return

    const primerHijo = el.firstElementChild as HTMLElement | null
    const paso = (primerHijo?.offsetWidth ?? 200) + GAP_PX
    const llegoAlFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4

    if (llegoAlFinal) {
      el.scrollTo({ left: 0, behavior: 'auto' })
    } else {
      el.scrollBy({ left: paso, behavior: 'smooth' })
    }
  }

  const detenerAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }
  }

  const iniciarAutoplay = () => {
    detenerAutoplay()
    autoplayRef.current = setInterval(avanzarCarrusel, AUTOPLAY_MS)
  }

  const pausarYReanudar = () => {
    detenerAutoplay()
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(iniciarAutoplay, RESUME_AFTER_MS)
  }

  useEffect(() => {
    if (cargando) return
    iniciarAutoplay()
    return () => {
      detenerAutoplay()
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [cargando])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-10">
      <div className="max-w-md mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center">
          <UserCircle size={20} className="text-[#e6e6e6]" />
        </div>
        {email ? (
          <>
            <p className="text-xs text-[#9a9a9a]">{email}</p>
            <button onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={20} className="text-[#9a9a9a]" />
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-[#9a9a9a]">Explorando como invitado</p>
            <Link href="/login" className="text-xs text-[#e29b9b] hover:underline">Ingresar</Link>
          </>
        )}
      </div>

      <div className="max-w-md mx-auto px-5 mt-6 grid grid-cols-4 gap-y-5 gap-x-2">
        {accesos.map((a) => {
          const Icon = a.icon
          const mostrarPunto = a.href === '/solicitudes' && hayNotificacion
          return (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-1.5 text-center">
              <div className="relative w-12 h-12 rounded-full bg-[#f2f0ea] flex items-center justify-center">
                <Icon size={22} className="text-[#1c1c1c]" />
                {mostrarPunto && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-[#a32d2d] rounded-full border-2 border-[#0d0d0d]" />
                )}
              </div>
              <span className="text-[10.5px] text-[#d8d8d8] leading-tight">{a.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="mt-7 pl-5">
        <div
          ref={scrollRef}
          onMouseDown={pausarYReanudar}
          onTouchStart={pausarYReanudar}
          onWheel={pausarYReanudar}
          className="flex gap-3 overflow-x-auto pb-2 pr-5 max-w-md mx-auto scrollbar-hide scroll-smooth"
        >
          {banners.map((b, i) => (
            <div key={i} className="min-w-[200px] bg-[#161616] border border-[#262626] rounded-xl overflow-hidden flex-shrink-0">
              <div className="h-16" style={{ backgroundColor: b.color }} />
              <div className="p-3">
                <p className="text-sm font-medium text-white">{b.titulo}</p>
                <p className="text-xs text-[#9a9a9a] mt-0.5">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 mt-7">
        <Link
          href="/sparring"
          className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-3 flex items-center justify-center gap-2 transition"
        >
          <Search size={18} /> Buscar sparring ahora
        </Link>

        <Link
          href="/soy-empresa"
          className="block text-center mt-4 text-xs text-[#9a9a9a] hover:text-[#e29b9b] hover:underline"
        >
          ¿Tienes una escuela, marca o promotora de eventos? Soy empresa →
        </Link>
      </div>
    </div>
  )
}