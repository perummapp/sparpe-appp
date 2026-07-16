'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { CATEGORIAS_MMA } from '@/lib/categoriasMMA'

type PeleadorOficial = {
  id: string
  nombre: string
  categoria_peso: string
  edad: number | null
  record: string | null
  equipo: string | null
  ciudad: string | null
  foto_url: string | null
  orden: number | null
}

export default function RankingOficialPage() {
  const [cargando, setCargando] = useState(true)
  const [peleadores, setPeleadores] = useState<PeleadorOficial[]>([])

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('peleadores_oficiales')
        .select('id, nombre, categoria_peso, edad, record, equipo, ciudad, foto_url, orden')
        .eq('activo', true)

      setPeleadores(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  const porCategoria = (categoria: string) =>
    peleadores
      .filter((p) => p.categoria_peso === categoria)
      .sort((a, b) => {
        if (a.orden !== null && b.orden !== null) return a.orden - b.orden
        if (a.orden !== null) return -1
        if (b.orden !== null) return 1
        return a.nombre.localeCompare(b.nombre)
      })

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Ranking Oficial MMA</h1>
          <Link href="/inicio" className="text-sm text-accent-light hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-muted mb-6">
          Vitrina de la escena peruana de MMA, por categoría de peso.
        </p>

        {peleadores.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay peleadores cargados.</p>
        )}

        {CATEGORIAS_MMA.map((categoria) => {
          const lista = porCategoria(categoria)
          if (lista.length === 0) return null

          return (
            <div key={categoria} className="mb-6">
              <h2 className="text-sm text-muted uppercase tracking-wide mb-2">{categoria}</h2>
              <div className="space-y-2">
                {lista.map((p, index) => (
                  <div key={p.id} className="card-surface rounded-xl p-4 flex items-center gap-3">
                    <p className="text-lg font-bold text-accent-light w-6 shrink-0">{index + 1}</p>
                    {p.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto_url} alt={p.nombre} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {p.equipo || 'Sin equipo'}{p.ciudad ? ` · ${p.ciudad}` : ''}{p.edad ? ` · ${p.edad} años` : ''}
                      </p>
                    </div>
                    {p.record && (
                      <p className="text-sm text-white font-medium shrink-0">{p.record}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}