'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import SelectSheet from '@/components/SelectSheet'
import { DISCIPLINAS } from '@/lib/disciplinas'
import { DISTRITOS } from '@/lib/distritos'

type EntrenadorStats = {
  id: string
  nombre: string
  especialidad: string | null
  descripcion: string | null
  tarifa: string | null
  distrito: string | null
  contacto: string | null
  calificacion_promedio: number
  total_resenas: number
  total_seguidores: number
}

export default function EntrenadoresPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [entrenadores, setEntrenadores] = useState<EntrenadorStats[]>([])
  const [siguiendo, setSiguiendo] = useState<Set<string>>(new Set())

  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [filtroDistrito, setFiltroDistrito] = useState('')

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? ''
      setUserId(uid)

      const { data: lista } = await supabase
        .from('entrenadores_stats')
        .select('*')
        .eq('verificado', true)
        .order('total_seguidores', { ascending: false })

      setEntrenadores(lista ?? [])

      if (uid) {
        const { data: misSeguidos } = await supabase
          .from('seguidores_entrenador')
          .select('entrenador_id')
          .eq('seguidor_id', uid)

        setSiguiendo(new Set((misSeguidos ?? []).map((s) => s.entrenador_id)))
      }

      setCargando(false)
    }
    cargar()
  }, [])

  const toggleSeguir = async (entrenadorId: string) => {
    if (siguiendo.has(entrenadorId)) {
      await supabase.from('seguidores_entrenador').delete().eq('entrenador_id', entrenadorId).eq('seguidor_id', userId)
      setSiguiendo((prev) => {
        const nuevo = new Set(prev)
        nuevo.delete(entrenadorId)
        return nuevo
      })
      setEntrenadores((prev) => prev.map((e) => e.id === entrenadorId ? { ...e, total_seguidores: e.total_seguidores - 1 } : e))
    } else {
      await supabase.from('seguidores_entrenador').insert({ entrenador_id: entrenadorId, seguidor_id: userId })
      setSiguiendo((prev) => new Set(prev).add(entrenadorId))
      setEntrenadores((prev) => prev.map((e) => e.id === entrenadorId ? { ...e, total_seguidores: e.total_seguidores + 1 } : e))
    }
  }

  const entrenadoresFiltrados = entrenadores.filter((e) => {
    const okEspecialidad = filtroEspecialidad === '' || (e.especialidad ?? '').toLowerCase().includes(filtroEspecialidad.toLowerCase())
    const okDistrito = filtroDistrito === '' || (e.distrito ?? '').toLowerCase().includes(filtroDistrito.toLowerCase())
    return okEspecialidad && okDistrito
  })

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Encuentra un entrenador</h1>
          <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-[#9a9a9a] mb-5">
          Entrenadores y peleadores que ofrecen clases particulares.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <SelectSheet
            value={filtroEspecialidad}
            onChange={setFiltroEspecialidad}
            options={[{ value: '', label: 'Todas las especialidades' }, ...DISCIPLINAS.map((d) => ({ value: d, label: d }))]}
            placeholder="Especialidad"
          />
          <SelectSheet
            value={filtroDistrito}
            onChange={setFiltroDistrito}
            options={[{ value: '', label: 'Todos los distritos' }, ...DISTRITOS.map((d) => ({ value: d, label: d }))]}
            placeholder="Distrito"
          />
        </div>

        {entrenadoresFiltrados.length === 0 && (
          <p className="text-sm text-[#9a9a9a]">
            Todavía no hay entrenadores verificados con esos filtros.
          </p>
        )}

        <div className="space-y-3">
          {entrenadoresFiltrados.map((e) => {
            const yaSigo = siguiendo.has(e.id)
            return (
              <div key={e.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-medium">{e.nombre}</p>
                    <p className="text-sm text-[#9a9a9a] mt-1">
                      {e.especialidad || '—'} · {e.distrito || 'Sin distrito'}
                    </p>
                  </div>
                  {userId ? (
                    <button
                      onClick={() => toggleSeguir(e.id)}
                      className={`shrink-0 text-xs rounded-lg px-3 py-1.5 border transition ${
                        yaSigo ? 'border-[#333] text-[#9a9a9a]' : 'bg-[#a32d2d] border-[#a32d2d] text-white hover:bg-[#8f2626]'
                      }`}
                    >
                      {yaSigo ? 'Siguiendo' : 'Seguir'}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="shrink-0 text-xs rounded-lg px-3 py-1.5 border border-[#333] text-[#9a9a9a] hover:border-[#a32d2d]"
                    >
                      Seguir
                    </Link>
                  )}
                </div>

                {e.descripcion && <p className="text-sm text-[#d8d8d8] mt-2">{e.descripcion}</p>}

                <div className="flex items-center gap-4 mt-2 text-xs text-[#9a9a9a]">
                  {e.total_resenas > 0 && (
                    <span className="flex items-center gap-1"><Star size={12} className="text-[#e29b9b]" /> {e.calificacion_promedio.toFixed(1)} ({e.total_resenas})</span>
                  )}
                  <span className="flex items-center gap-1"><Users size={12} /> {e.total_seguidores} seguidores</span>
                </div>

                {(e.tarifa || e.contacto) && (
                  <p className="text-xs text-[#6b6b6b] mt-2">
                    {e.tarifa}{e.tarifa && e.contacto ? ' · ' : ''}{e.contacto}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <Link
          href="/entrenadores/mi-entrenador"
          className="block text-center mt-8 text-xs text-[#9a9a9a] hover:text-[#e29b9b] hover:underline"
        >
          ¿Enseñas tú? Ofrece clases personalizadas →
        </Link>
      </div>
    </div>
  )
}