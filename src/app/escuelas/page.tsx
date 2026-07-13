'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Escuela = {
  id: string
  nombre: string
  descripcion: string | null
  disciplinas: string | null
  distrito: string | null
  direccion: string | null
  telefono: string | null
}

type Oferta = {
  id: string
  nombre_negocio: string | null
  titulo: string
  descripcion: string | null
  vigente_hasta: string | null
}

export default function EscuelasPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [miEscuela, setMiEscuela] = useState<Escuela | null>(null)
  const [ofertas, setOfertas] = useState<Oferta[]>([])

  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroDistrito, setFiltroDistrito] = useState('')

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? ''
      setUserId(uid)

      const { data: publicas } = await supabase
        .from('escuelas')
        .select('*')
        .eq('verificado', true)
        .order('nombre', { ascending: true })

      setEscuelas(publicas ?? [])

      if (uid) {
        const { data: propia } = await supabase.from('escuelas').select('*').eq('id', uid).single()
        setMiEscuela(propia ?? null)
      }

      const idsVerificados = (publicas ?? []).map((e) => e.id)
      if (idsVerificados.length > 0) {
        const { data: ofertasData } = await supabase
          .from('ofertas')
          .select('id, nombre_negocio, titulo, descripcion, vigente_hasta')
          .eq('propietario_tipo', 'escuela')
          .eq('activa', true)
          .in('propietario_id', idsVerificados)
          .order('creado_en', { ascending: false })
        setOfertas(ofertasData ?? [])
      }

      setCargando(false)
    }
    cargar()
  }, [])

  const escuelasFiltradas = escuelas.filter((e) => {
    const okDisciplina = filtroDisciplina === '' || (e.disciplinas ?? '').toLowerCase().includes(filtroDisciplina.toLowerCase())
    const okDistrito = filtroDistrito === '' || (e.distrito ?? '').toLowerCase().includes(filtroDistrito.toLowerCase())
    return okDisciplina && okDistrito
  })

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d]"

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Escuelas cerca</h1>
          <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-[#9a9a9a] mb-5">
          Directorio de escuelas y gimnasios de deportes de contacto en Perú.
        </p>

        {userId ? (
          <Link
            href="/escuelas/mi-escuela"
            className="block w-full text-center bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2.5 mb-6 transition"
          >
            {miEscuela ? 'Editar mi escuela' : '+ Registrar mi escuela'}
          </Link>
        ) : (
          <Link
            href="/login"
            className="block w-full text-center border border-[#333] text-[#9a9a9a] text-sm font-medium rounded-lg py-2.5 mb-6 transition hover:border-[#a32d2d]"
          >
            Inicia sesión para registrar tu escuela
          </Link>
        )}

        {ofertas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide mb-2">Ofertas activas</h2>
            <div className="space-y-2">
              {ofertas.map((o) => (
                <div key={o.id} className="bg-[#161616] border border-[#a32d2d]/40 rounded-xl p-3">
                  <p className="text-sm text-white font-medium">🔥 {o.titulo}</p>
                  <p className="text-xs text-[#9a9a9a] mt-0.5">{o.nombre_negocio}</p>
                  {o.descripcion && <p className="text-xs text-[#d8d8d8] mt-1">{o.descripcion}</p>}
                  {o.vigente_hasta && <p className="text-[10px] text-[#6b6b6b] mt-1">Vigente hasta {o.vigente_hasta}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-6">
          <input placeholder="Disciplina" value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)} className={inputClass} />
          <input placeholder="Distrito" value={filtroDistrito} onChange={(e) => setFiltroDistrito(e.target.value)} className={inputClass} />
        </div>

        {escuelasFiltradas.length === 0 && (
          <p className="text-sm text-[#9a9a9a]">
            Todavía no hay escuelas verificadas con esos filtros.
          </p>
        )}

        <div className="space-y-3">
          {escuelasFiltradas.map((e) => (
            <div key={e.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{e.nombre}</p>
                {e.id === userId && (
                  <span className="text-[10px] uppercase tracking-wide text-[#a32d2d] border border-[#a32d2d] rounded px-1.5 py-0.5">Tu escuela</span>
                )}
              </div>
              <p className="text-sm text-[#9a9a9a] mt-1">
                {e.disciplinas || '—'} · {e.distrito || 'Sin distrito'}
              </p>
              {e.descripcion && <p className="text-sm text-[#d8d8d8] mt-2">{e.descripcion}</p>}
              {(e.direccion || e.telefono) && (
                <p className="text-xs text-[#6b6b6b] mt-2">
                  {e.direccion}{e.direccion && e.telefono ? ' · ' : ''}{e.telefono}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}