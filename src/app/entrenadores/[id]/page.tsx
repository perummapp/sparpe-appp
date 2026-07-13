'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Star, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Entrenador = {
  id: string
  nombre: string
  especialidad: string | null
  descripcion: string | null
  tarifa: string | null
  distrito: string | null
  contacto: string | null
}

type Resena = {
  id: string
  autor_id: string
  autor_nombre: string
  calificacion: number
  comentario: string | null
  creado_en: string
}

export default function EntrenadorDetallePage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [userNombre, setUserNombre] = useState('')
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null)
  const [resenas, setResenas] = useState<Resena[]>([])
  const [siguiendo, setSiguiendo] = useState(false)
  const [totalSeguidores, setTotalSeguidores] = useState(0)

  const [miCalificacion, setMiCalificacion] = useState(5)
  const [miComentario, setMiComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const entrenadorId = params.id as string

  const cargarResenas = async () => {
    const { data } = await supabase
      .from('resenas_entrenador')
      .select('*')
      .eq('entrenador_id', entrenadorId)
      .order('creado_en', { ascending: false })
    setResenas(data ?? [])
  }

  useEffect(() => {
    const iniciar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: miPerfil } = await supabase.from('perfiles').select('nombre').eq('id', userData.user.id).single()
      setUserNombre(miPerfil?.nombre ?? '')

      const { data: ent, error: entError } = await supabase.from('entrenadores').select('*').eq('id', entrenadorId).single()
      if (entError || !ent) {
        setError('No se encontró este entrenador.')
        setCargando(false)
        return
      }
      setEntrenador(ent)

      await cargarResenas()

      const { data: seguido } = await supabase
        .from('seguidores_entrenador')
        .select('id')
        .eq('entrenador_id', entrenadorId)
        .eq('seguidor_id', userData.user.id)
        .maybeSingle()
      setSiguiendo(!!seguido)

      const { count } = await supabase
        .from('seguidores_entrenador')
        .select('id', { count: 'exact', head: true })
        .eq('entrenador_id', entrenadorId)
      setTotalSeguidores(count ?? 0)

      setCargando(false)
    }
    iniciar()
  }, [router, entrenadorId])

  const toggleSeguir = async () => {
    if (siguiendo) {
      await supabase.from('seguidores_entrenador').delete().eq('entrenador_id', entrenadorId).eq('seguidor_id', userId)
      setSiguiendo(false)
      setTotalSeguidores((n) => n - 1)
    } else {
      await supabase.from('seguidores_entrenador').insert({ entrenador_id: entrenadorId, seguidor_id: userId })
      setSiguiendo(true)
      setTotalSeguidores((n) => n + 1)
    }
  }

  const miResena = resenas.find((r) => r.autor_id === userId)

  const handleEnviarResena = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setMensaje('')

    const { error: resenaError } = await supabase.from('resenas_entrenador').upsert(
      {
        entrenador_id: entrenadorId,
        autor_id: userId,
        autor_nombre: userNombre,
        calificacion: miCalificacion,
        comentario: miComentario,
      },
      { onConflict: 'entrenador_id,autor_id' }
    )

    setEnviando(false)

    if (resenaError) {
      setMensaje('Error: ' + resenaError.message)
    } else {
      setMensaje('¡Reseña guardada!')
      await cargarResenas()
    }
  }

  const promedio = resenas.length > 0
    ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(1)
    : null

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[#e29b9b] mb-4">{error}</p>
        <Link href="/entrenadores" className="text-[#e29b9b] hover:underline text-sm">← Volver</Link>
      </div>
    )
  }

  const esUnoMismo = entrenador!.id === userId
  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d]"

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <Link href="/entrenadores" className="text-sm text-[#e29b9b] hover:underline">← Entrenadores</Link>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 mt-3">
          <h1 className="text-xl font-bold text-white">{entrenador!.nombre}</h1>
          <p className="text-sm text-[#9a9a9a] mt-1">
            {entrenador!.especialidad || '—'} · {entrenador!.distrito || 'Sin distrito'}
          </p>
          {entrenador!.tarifa && <p className="text-sm text-[#d8d8d8] mt-1">Tarifa: {entrenador!.tarifa}</p>}
          {entrenador!.contacto && <p className="text-sm text-[#d8d8d8] mt-1">Contacto: {entrenador!.contacto}</p>}
          {entrenador!.descripcion && <p className="text-sm text-[#d8d8d8] mt-3">{entrenador!.descripcion}</p>}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-sm text-[#e29b9b]">
              <Star size={14} fill="currentColor" />
              {promedio ?? 'Sin reseñas'} {resenas.length > 0 && <span className="text-[#6b6b6b]">({resenas.length})</span>}
            </div>
            <div className="flex items-center gap-1 text-sm text-[#9a9a9a]">
              <Users size={14} /> {totalSeguidores} seguidores
            </div>
          </div>

          {!esUnoMismo && (
            <button
              onClick={toggleSeguir}
              className={`mt-3 text-sm rounded-lg px-3 py-1.5 transition ${
                siguiendo ? 'border border-[#333] text-[#9a9a9a]' : 'bg-[#a32d2d] hover:bg-[#8f2626] text-white'
              }`}
            >
              {siguiendo ? 'Siguiendo' : 'Seguir'}
            </button>
          )}
        </div>

        {!esUnoMismo && (
          <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 mt-4">
            <h2 className="text-sm text-white font-medium mb-2">{miResena ? 'Editar mi reseña' : 'Deja tu reseña'}</h2>
            <form onSubmit={handleEnviarResena}>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMiCalificacion(n)}
                    className={n <= miCalificacion ? 'text-[#e29b9b]' : 'text-[#333]'}
                  >
                    <Star size={22} fill="currentColor" />
                  </button>
                ))}
              </div>
              <textarea
                value={miComentario}
                onChange={(e) => setMiComentario(e.target.value)}
                rows={2}
                placeholder="¿Cómo fue tu experiencia?"
                className={inputClass + ' mb-3'}
              />
              <button type="submit" disabled={enviando}
                className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm rounded-lg px-4 py-2 transition disabled:opacity-50">
                {enviando ? 'Guardando...' : miResena ? 'Actualizar reseña' : 'Enviar reseña'}
              </button>
              {mensaje && <p className="text-sm text-[#e29b9b] mt-2">{mensaje}</p>}
            </form>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide mb-2">Reseñas</h2>
          {resenas.length === 0 && <p className="text-sm text-[#9a9a9a]">Todavía no hay reseñas.</p>}
          <div className="space-y-3">
            {resenas.map((r) => (
              <div key={r.id} className="bg-[#161616] border border-[#262626] rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">{r.autor_nombre}</p>
                  <div className="flex items-center gap-0.5 text-[#e29b9b]">
                    <Star size={13} fill="currentColor" /> {r.calificacion}
                  </div>
                </div>
                {r.comentario && <p className="text-sm text-[#9a9a9a] mt-1">{r.comentario}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}