'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: lista } = await supabase
        .from('entrenadores_stats')
        .select('*')
        .order('total_seguidores', { ascending: false })

      setEntrenadores(lista ?? [])

      const { data: misSeguidos } = await supabase
        .from('seguidores_entrenador')
        .select('entrenador_id')
        .eq('seguidor_id', userData.user.id)

      setSiguiendo(new Set((misSeguidos ?? []).map((s) => s.entrenador_id)))
      setCargando(false)
    }
    cargar()
  }, [router])

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
    const okEspecialidad = filtroEspecialidad === '' || (e.especialidad ?? '') === filtroEspecialidad
    const okDistrito = filtroDistrito === '' || (e.distrito ?? '') === filtroDistrito
    return okEspecialidad && okDistrito
  })

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const opcionesEspecialidad = [{ value: '', label: 'Todas las especialidades' }, ...DISCIPLINAS.map((d) => ({ value: d, label: d }))]
  const opcionesDistrito = [{ value: '', label: 'Todos los distritos' }, ...DISTRITOS.map((d) => ({ value: d, label: d }))]

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

        <Link
          href="/entrenadores/mi-entrenador"
          className="block w-full text-center bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2.5 mb-6 transition"
        >
          + Publicar mi oferta de clases
        </Link>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <SelectSheet
            value={filtroEspecialidad}
            onChange={setFiltroEspecialidad}
            options={opcionesEspecialidad}
            placeholder="Especialidad"
          />
          <SelectSheet
            value={filtroDistrito}
            onChange={setFiltroDistrito}
            options={opcionesDistrito}
            placeholder="Distrito"
          />
        </div>

        {entrenadoresFiltrados.length === 0 && (
          <p className="text-sm text-[#9a9a9a]">Todavía no hay entrenadores registrados con esos filtros.</p>
        )}

        <div className="space-y-3">
          {entrenadoresFiltrados.map((e) => (
            <div key={e.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
              <Link href={`/entrenadores/${e.id}`}>
                <p className="text-white font-medium">{e.nombre}</p>
                <p className="text-sm text-[#9a9a9a] mt-1">
                  {e.especialidad || '—'} · {e.distrito || 'Sin distrito'}{e.tarifa ? ` · ${e.tarifa}` : ''}
                </p>
              </Link>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm text-[#e29b9b]">
                  <Star size={14} fill="currentColor" />
                  {e.total_resenas > 0 ? e.calificacion_promedio.toFixed(1) : 'Sin reseñas'}
                  {e.total_resenas > 0 && <span className="text-[#6b6b6b]">({e.total_resenas})</span>}
                </div>
                <div className="flex items-center gap-1 text-sm text-[#9a9a9a]">
                  <Users size={14} /> {e.total_seguidores}
                </div>
              </div>

              {e.id !== userId && (
                <button
                  onClick={() => toggleSeguir(e.id)}
                  className={`mt-3 text-sm rounded-lg px-3 py-1.5 transition ${
                    siguiendo.has(e.id)
                      ? 'border border-[#333] text-[#9a9a9a]'
                      : 'bg-[#a32d2d] hover:bg-[#8f2626] text-white'
                  }`}
                >
                  {siguiendo.has(e.id) ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}