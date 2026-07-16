'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type FilaRanking = {
  id: string
  nombre: string
  distrito: string | null
  disciplina: string | null
  total_sparrings: number
  calificacion_promedio: number
  total_resenas: number
}

export default function RankingPage() {
  const [cargando, setCargando] = useState(true)
  const [ranking, setRanking] = useState<FilaRanking[]>([])

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('ranking_comunidad')
        .select('*')
        .order('total_sparrings', { ascending: false })
        .order('calificacion_promedio', { ascending: false })

      setRanking(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Ranking Comunidad</h1>
        <p className="text-sm text-muted mb-6">
          Peleadores ordenados por cantidad de sparrings confirmados y calificación promedio.
        </p>

        {ranking.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay peleadores en el ranking.</p>
        )}

        <div className="space-y-2">
          {ranking.map((r, index) => (
            <div key={r.id} className="card-surface rounded-xl p-4 flex items-center gap-3">
              <p className="text-lg font-bold text-accent-light w-6 shrink-0">{index + 1}</p>
              <div className="flex-1">
                <p className="text-white font-medium">{r.nombre}</p>
                <p className="text-xs text-muted mt-0.5">
                  {r.disciplina || '—'} · {r.distrito || 'Sin distrito'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-white font-medium">{r.total_sparrings} sparrings</p>
                <p className="text-xs text-muted mt-0.5">
                  {r.total_resenas > 0 ? `★ ${r.calificacion_promedio.toFixed(1)}` : 'Sin reseñas'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}