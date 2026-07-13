'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  mensaje: string
  estado: string
  confirmado_solicitante: boolean
  confirmado_receptor: boolean
  realizado_en: string | null
  resena_solicitante_hecha: boolean
  resena_receptor_hecha: boolean
}

export default function SolicitudesPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [recibidas, setRecibidas] = useState<Solicitud[]>([])
  const [enviadas, setEnviadas] = useState<Solicitud[]>([])
  const [mensaje, setMensaje] = useState('')

  const [abiertoResenaId, setAbiertoResenaId] = useState<string | null>(null)
  const [calificacion, setCalificacion] = useState(5)
  const [comentario, setComentario] = useState('')
  const [enviandoResena, setEnviandoResena] = useState(false)

  const router = useRouter()

  const cargarTodo = async (uid: string) => {
    const { data: rec } = await supabase.from('solicitudes_sparring').select('*').eq('receptor_id', uid).order('creado_en', { ascending: false })
    const { data: env } = await supabase.from('solicitudes_sparring').select('*').eq('solicitante_id', uid).order('creado_en', { ascending: false })
    setRecibidas(rec ?? [])
    setEnviadas(env ?? [])
  }

  useEffect(() => {
    const iniciar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)
      await cargarTodo(userData.user.id)
      setCargando(false)
    }
    iniciar()
  }, [router])

  const responder = async (id: string, estado: string) => {
    setMensaje('')
    const { error } = await supabase.from('solicitudes_sparring').update({ estado }).eq('id', id)
    if (error) setMensaje('Error: ' + error.message)
    else await cargarTodo(userId)
  }

  const handleConfirmar = async (s: Solicitud) => {
    setMensaje('')
    const soyElSolicitante = s.solicitante_id === userId
    const campo = soyElSolicitante ? 'confirmado_solicitante' : 'confirmado_receptor'

    const { error } = await supabase.from('solicitudes_sparring').update({ [campo]: true }).eq('id', s.id)
    if (error) { setMensaje('Error: ' + error.message); return }

    const otroYaConfirmo = soyElSolicitante ? s.confirmado_receptor : s.confirmado_solicitante
    if (otroYaConfirmo && !s.realizado_en) {
      await supabase.from('solicitudes_sparring').update({ realizado_en: new Date().toISOString() }).eq('id', s.id)
    }

    await cargarTodo(userId)
  }

  const handleEnviarResena = async (s: Solicitud) => {
    setEnviandoResena(true)
    setMensaje('')

    const soyElSolicitante = s.solicitante_id === userId
    const calificadoId = soyElSolicitante ? s.receptor_id : s.solicitante_id
    const campoResena = soyElSolicitante ? 'resena_solicitante_hecha' : 'resena_receptor_hecha'

    const { error } = await supabase.from('resenas_sparring').insert({
      solicitud_id: s.id,
      autor_id: userId,
      calificado_id: calificadoId,
      calificacion,
      comentario: comentario || null,
    })

    if (error) {
      setEnviandoResena(false)
      setMensaje('Error: ' + error.message)
      return
    }

    await supabase.from('solicitudes_sparring').update({ [campoResena]: true }).eq('id', s.id)

    setEnviandoResena(false)
    setAbiertoResenaId(null)
    setCalificacion(5)
    setComentario('')
    await cargarTodo(userId)
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const estadoColor = (estado: string) =>
    estado === 'aceptada' ? 'text-green-400' : estado === 'rechazada' ? 'text-red-400' : 'text-amber-400'

  const renderAccionesSparring = (s: Solicitud) => {
    if (s.estado !== 'aceptada') return null

    const soyElSolicitante = s.solicitante_id === userId
    const miConfirmacion = soyElSolicitante ? s.confirmado_solicitante : s.confirmado_receptor
    const miResenaHecha = soyElSolicitante ? s.resena_solicitante_hecha : s.resena_receptor_hecha

    if (!miConfirmacion) {
      return (
        <button
          onClick={() => handleConfirmar(s)}
          className="mt-2 bg-[#a32d2d] hover:bg-[#8f2626] text-white text-xs rounded-lg px-3 py-1.5 transition"
        >
          Confirmar que el sparring se realizó
        </button>
      )
    }

    if (miResenaHecha) {
      return <p className="text-xs text-[#7fd1a3] mt-2">✓ Confirmado{s.realizado_en ? ' · reseña enviada' : ''}</p>
    }

    if (abiertoResenaId !== s.id) {
      return (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-[#7fd1a3]">✓ Confirmado por ti</p>
          <button onClick={() => setAbiertoResenaId(s.id)} className="text-xs text-[#e29b9b] hover:underline">
            Dejar reseña
          </button>
        </div>
      )
    }

    return (
      <div className="mt-3 border-t border-[#262626] pt-3 space-y-2">
        <p className="text-xs text-[#9a9a9a]">
          Tu reseña es interna: nadie más la ve, solo se usa para revisar reportes.
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCalificacion(n)}
              className={`text-xl ${n <= calificacion ? 'text-[#e29b9b]' : 'text-[#333]'}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario (opcional) — solo visible internamente, ej. reportar algo negativo o positivo"
          rows={2}
          className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleEnviarResena(s)}
            disabled={enviandoResena}
            className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-xs rounded-lg px-3 py-1.5 transition disabled:opacity-50"
          >
            {enviandoResena ? 'Enviando...' : 'Enviar reseña'}
          </button>
          <button onClick={() => setAbiertoResenaId(null)} className="border border-[#333] text-[#9a9a9a] text-xs rounded-lg px-3 py-1.5">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Solicitudes</h1>
          <Link href="/sparring" className="text-sm text-[#e29b9b] hover:underline">← Buscar sparring</Link>
        </div>

        {mensaje && <p className="text-sm text-[#e29b9b] mb-4">{mensaje}</p>}

        <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide mb-2">Recibidas</h2>
        {recibidas.length === 0 && <p className="text-sm text-[#9a9a9a] mb-6">No tienes solicitudes recibidas.</p>}
        <div className="space-y-3 mb-8">
          {recibidas.map((s) => (
            <div key={s.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
              <p className="text-white font-medium">{s.solicitante_nombre}</p>
              <p className="text-sm text-[#9a9a9a] mt-1">{s.fecha_propuesta || 'Sin fecha'} · {s.gimnasio_propuesto || 'Lugar por coordinar'}</p>
              {s.mensaje && <p className="text-sm text-[#9a9a9a] mt-1 italic">&quot;{s.mensaje}&quot;</p>}
              <p className="text-sm mt-1">Estado: <span className={`font-medium ${estadoColor(s.estado)}`}>{s.estado}</span></p>
              <Link href={`/solicitudes/${s.id}`} className="text-sm text-[#e29b9b] hover:underline mt-2 inline-block">
                Abrir chat
              </Link>
              {s.estado === 'pendiente' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => responder(s.id, 'aceptada')} className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm rounded-lg px-3 py-1.5 transition">Aceptar</button>
                  <button onClick={() => responder(s.id, 'rechazada')} className="border border-[#a32d2d] text-[#e29b9b] text-sm rounded-lg px-3 py-1.5 hover:bg-[#a32d2d] hover:text-white transition">Rechazar</button>
                </div>
              )}
              {renderAccionesSparring(s)}
            </div>
          ))}
        </div>

        <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide mb-2">Enviadas</h2>
        {enviadas.length === 0 && <p className="text-sm text-[#9a9a9a]">No has enviado solicitudes.</p>}
        <div className="space-y-3">
          {enviadas.map((s) => (
            <div key={s.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
              <p className="text-white font-medium">{s.receptor_nombre}</p>
              <p className="text-sm text-[#9a9a9a] mt-1">{s.fecha_propuesta || 'Sin fecha'} · {s.gimnasio_propuesto || 'Lugar por coordinar'}</p>
              <p className="text-sm mt-1">Estado: <span className={`font-medium ${estadoColor(s.estado)}`}>{s.estado}</span></p>
              <Link href={`/solicitudes/${s.id}`} className="text-sm text-[#e29b9b] hover:underline mt-2 inline-block">
                Abrir chat
              </Link>
              {renderAccionesSparring(s)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}