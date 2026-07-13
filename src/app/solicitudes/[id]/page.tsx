'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Solicitud = {
  id: string
  solicitante_id: string
  solicitante_nombre: string
  receptor_id: string
  receptor_nombre: string
  fecha_propuesta: string
  gimnasio_propuesto: string
}

type Mensaje = {
  id: string
  remitente_id: string
  contenido: string
}

export default function ChatSparringPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [userNombre, setUserNombre] = useState('')
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const solicitudId = params.id as string
  const finRef = useRef<HTMLDivElement>(null)

  const cargarMensajes = async () => {
    const { data } = await supabase
      .from('mensajes_sparring')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('creado_en', { ascending: true })
    setMensajes(data ?? [])
  }

  useEffect(() => {
    const iniciar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: miPerfil } = await supabase.from('perfiles').select('nombre').eq('id', userData.user.id).single()
      setUserNombre(miPerfil?.nombre ?? '')

      const { data: sol, error: solError } = await supabase
        .from('solicitudes_sparring')
        .select('*')
        .eq('id', solicitudId)
        .single()

      if (solError || !sol) {
        setError('No se encontró esta conversación.')
        setCargando(false)
        return
      }

      if (sol.solicitante_id !== userData.user.id && sol.receptor_id !== userData.user.id) {
        setError('No tienes acceso a esta conversación.')
        setCargando(false)
        return
      }

      setSolicitud(sol)
      await cargarMensajes()
      setCargando(false)
    }
    iniciar()
  }, [router, solicitudId])

  useEffect(() => {
    const intervalo = setInterval(cargarMensajes, 4000)
    return () => clearInterval(intervalo)
  }, [solicitudId])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)

    const { error } = await supabase.from('mensajes_sparring').insert({
      solicitud_id: solicitudId,
      remitente_id: userId,
      remitente_nombre: userNombre,
      contenido: texto.trim(),
    })

    setEnviando(false)
    if (!error) {
      setTexto('')
      await cargarMensajes()
    }
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[#e29b9b] mb-4">{error}</p>
        <Link href="/solicitudes" className="text-[#e29b9b] hover:underline text-sm">← Volver a solicitudes</Link>
      </div>
    )
  }

  const otroNombre = solicitud!.solicitante_id === userId ? solicitud!.receptor_nombre : solicitud!.solicitante_nombre

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <div className="max-w-md mx-auto w-full px-5 pt-6 pb-3 border-b border-[#262626]">
        <Link href="/solicitudes" className="text-xs text-[#9a9a9a] hover:underline">← Solicitudes</Link>
        <h1 className="text-xl font-bold text-white mt-1">{otroNombre}</h1>
        <p className="text-xs text-[#9a9a9a] mt-0.5">
          {solicitud!.fecha_propuesta || 'Sin fecha definida'} · {solicitud!.gimnasio_propuesto || 'Lugar por coordinar'}
        </p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-5 py-4 overflow-y-auto space-y-2">
        {mensajes.length === 0 && (
          <p className="text-sm text-[#6b6b6b] text-center mt-6">
            Aún no hay mensajes. Escribe para coordinar el sparring.
          </p>
        )}
        {mensajes.map((m) => {
          const esMio = m.remitente_id === userId
          return (
            <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${esMio ? 'bg-[#a32d2d] text-white' : 'bg-[#1e1e1e] text-[#e6e6e6] border border-[#262626]'}`}>
                {m.contenido}
              </div>
            </div>
          )
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={handleEnviar} className="max-w-md mx-auto w-full px-5 py-4 border-t border-[#262626] flex gap-2">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-[#1e1e1e] border border-[#333] rounded-full px-4 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d]"
        />
        <button
          type="submit"
          disabled={enviando}
          className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm rounded-full px-4 py-2 transition disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}