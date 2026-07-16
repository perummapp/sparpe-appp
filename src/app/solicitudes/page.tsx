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
  mensaje_no_leido_solicitante: boolean
  mensaje_no_leido_receptor: boolean
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
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  const estadoColor = (estado: string) =>
    estado === 'aceptada' ? 'text-green-400' : estado === 'rechazada' ? 'text-red-400' : 'text-amber-400'

  const tieneMensajeNoLeido = (s: Solicitud, soyElSolicitante: boolean) =>
    soyElSolicitante ? s.mensaje_no_leido_solicitante : s.mensaje_no_leido_receptor

  const renderAccionesSparring = (s: Solicitud) => {
    if (s.estado !== 'aceptada') return null

    const soyElSolicitante = s.solicitante_id === userId
    const miConfirmacion = soyElSolicitante ? s.confirmado_solicitante : s.confirmado_receptor
    const miResenaHecha = soyElSolicitante ? s.resena_solicitante_hecha : s.resena_receptor_hecha

    if (!miConfirmacion) {
      return (
        <button
          onClick={() => handleConfirmar(s)}
          className="btn-primary mt-2 text-white text-xs rounded-lg px-3 py-1.5"
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
          <button onClick={() => setAbiertoResenaId(s.id)} className="text-xs text-accent-light hover:underline">
            Dejar reseña
          </button>
        </div>
      )
    }

    return (
      <div className="mt-3 border-t border-border pt-3 space-y-2">
        <p className="text-xs text-muted">
          Tu reseña es interna: nadie más la ve, solo se usa para revisar reportes.
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCalificacion(n)}
              className={`text-xl transition-colors duration-180 ${n <= calificacion ? 'text-accent-light' : 'text-[#333]'}`}
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
          className="input-glow w-full bg-[#1e1e1e] border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleEnviarResena(s)}
            disabled={enviandoResena}
            className="btn-primary text-white text-xs rounded-lg px-3 py-1.5 disabled:opacity-50"
          >
            {enviandoResena ? 'Enviando...' : 'Enviar reseña'}
          </button>
          <button onClick={() => setAbiertoResenaId(null)} className="btn-secondary text-muted text-xs rounded-lg px-3 py-1.5">
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
          <Link href="/sparring" className="text-sm text-accent-light hover:underline">← Buscar sparring</Link>
        </div>

        {mensaje && <p className="text-sm text-accent-light mb-4">{mensaje}</p>}

        <h2 className="text-sm text-muted uppercase tracking-wide mb-2">Recibidas</h2>
        {recibidas.length === 0 && <p className="text-sm text-muted mb-6">No tienes solicitudes recibidas.</p>}
        <div className="space-y-3 mb-8">
          {recibidas.map((s) => {
            const tieneNotificacion = s.estado === 'pendiente' || tieneMensajeNoLeido(s, false)
            return (
              <div key={s.id} className="card-surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-medium">{s.solicitante_nombre}</p>
                  {tieneNotificacion && <span className="shrink-0 mt-1 w-2 h-2 bg-accent rounded-full" />}
                </div>
                <p className="text-sm text-muted mt-1">{s.fecha_propuesta || 'Sin fecha'} · {s.gimnasio_propuesto || 'Lugar por coordinar'}</p>
                {s.mensaje && <p className="text-sm text-muted mt-1 italic">&quot;{s.mensaje}&quot;</p>}
                <p className="text-sm mt-1">Estado: <span className={`font-medium ${estadoColor(s.estado)}`}>{s.estado}</span></p>
                <Link href={`/solicitudes/${s.id}`} className="text-sm text-accent-light hover:underline mt-2 inline-flex items-center gap-1.5">
                  Abrir chat
                  {tieneMensajeNoLeido(s, false) && <span className="w-1.5 h-1.5 bg-accent rounded-full" />}
                </Link>
                {s.estado === 'pendiente' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => responder(s.id, 'aceptada')} className="btn-primary text-white text-sm rounded-lg px-3 py-1.5">Aceptar</button>
                    <button onClick={() => responder(s.id, 'rechazada')} className="btn-secondary text-accent-light text-sm rounded-lg px-3 py-1.5">Rechazar</button>
                  </div>
                )}
                {renderAccionesSparring(s)}
              </div>
            )
          })}
        </div>

        <h2 className="text-sm text-muted uppercase tracking-wide mb-2">Enviadas</h2>
        {enviadas.length === 0 && <p className="text-sm text-muted">No has enviado solicitudes.</p>}
        <div className="space-y-3">
          {enviadas.map((s) => {
            const tieneNotificacion = tieneMensajeNoLeido(s, true)
            return (
              <div key={s.id} className="card-surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-medium">{s.receptor_nombre}</p>
                  {tieneNotificacion && <span className="shrink-0 mt-1 w-2 h-2 bg-accent rounded-full" />}
                </div>
                <p className="text-sm text-muted mt-1">{s.fecha_propuesta || 'Sin fecha'} · {s.gimnasio_propuesto || 'Lugar por coordinar'}</p>
                <p className="text-sm mt-1">Estado: <span className={`font-medium ${estadoColor(s.estado)}`}>{s.estado}</span></p>
                <Link href={`/solicitudes/${s.id}`} className="text-sm text-accent-light hover:underline mt-2 inline-flex items-center gap-1.5">
                  Abrir chat
                  {tieneNotificacion && <span className="w-1.5 h-1.5 bg-accent rounded-full" />}
                </Link>
                {renderAccionesSparring(s)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}