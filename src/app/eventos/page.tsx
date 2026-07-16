'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import SelectSheet from '@/components/SelectSheet'
import { DISCIPLINAS } from '@/lib/disciplinas'
import { CIUDADES } from '@/lib/ciudades'

type Evento = {
  id: string
  nombre_negocio: string | null
  titulo: string
  descripcion: string | null
  disciplina: string | null
  fecha: string
  sede: string | null
  ciudad: string | null
  precio_referencial: number | null
  link_compra: string | null
  imagen_url: string | null
}

function formatoFecha(fechaISO: string) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  const diasCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const mesesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${diasCorto[fecha.getDay()]} ${dia} ${mesesCorto[mes - 1]}`
}

export default function EventosPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [categoriaCuenta, setCategoriaCuenta] = useState('persona')
  const [eventos, setEventos] = useState<Evento[]>([])

  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroCiudad, setFiltroCiudad] = useState('')

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        setUserId(userData.user.id)
        const { data: perfil } = await supabase.from('perfiles').select('categoria_cuenta').eq('id', userData.user.id).single()
        setCategoriaCuenta(perfil?.categoria_cuenta ?? 'persona')
      }

      const hoy = new Date().toISOString().slice(0, 10)

      const { data } = await supabase
        .from('eventos')
        .select('id, nombre_negocio, titulo, descripcion, disciplina, fecha, sede, ciudad, precio_referencial, link_compra, imagen_url')
        .eq('verificado', true)
        .eq('activo', true)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })

      setEventos(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  const eventosFiltrados = eventos.filter((e) => {
    const okDisciplina = filtroDisciplina === '' || (e.disciplina ?? '') === filtroDisciplina
    const okCiudad = filtroCiudad === '' || (e.ciudad ?? '') === filtroCiudad
    return okDisciplina && okCiudad
  })

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  const opcionesDisciplina = [{ value: '', label: 'Todas las disciplinas' }, ...DISCIPLINAS.map((d) => ({ value: d, label: d }))]
  const opcionesCiudad = [{ value: '', label: 'Todas las ciudades' }, ...CIUDADES.map((c) => ({ value: c, label: c }))]

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Eventos</h1>
          <Link href="/inicio" className="text-sm text-accent-light hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-muted mb-5">
          Eventos de deportes de contacto verificados en Perú, ordenados por fecha.
        </p>

        {categoriaCuenta === 'empresa' && (
          <Link
            href="/eventos/mi-evento"
            className="block w-full text-center btn-primary text-white text-sm font-medium rounded-lg py-2.5 mb-6"
          >
            + Publicar / editar mis eventos
          </Link>
        )}

        <div className="grid grid-cols-2 gap-2 mb-6">
          <SelectSheet
            value={filtroDisciplina}
            onChange={setFiltroDisciplina}
            options={opcionesDisciplina}
            placeholder="Disciplina"
          />
          <SelectSheet
            value={filtroCiudad}
            onChange={setFiltroCiudad}
            options={opcionesCiudad}
            placeholder="Ciudad"
          />
        </div>

        {eventosFiltrados.length === 0 && (
          <p className="text-sm text-muted">
            Todavía no hay eventos verificados próximos con esos filtros.
          </p>
        )}

        <div className="space-y-3">
          {eventosFiltrados.map((e, index) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
              className="card-surface rounded-xl overflow-hidden"
            >
              {e.imagen_url ? (
                <div className="w-full aspect-[4/5] bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.imagen_url} alt={e.titulo} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-[4/5] bg-surface flex items-center justify-center text-xs text-[#6b6b6b]">Sin afiche aún</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-medium">{e.titulo}</p>
                  <span className="shrink-0 text-xs text-accent-light font-medium">{formatoFecha(e.fecha)}</span>
                </div>
                <p className="text-sm text-muted mt-1">
                  {e.disciplina || '—'} · {e.sede || 'Sede por confirmar'}{e.ciudad ? ` · ${e.ciudad}` : ''}
                </p>
                {e.nombre_negocio && <p className="text-xs text-[#6b6b6b] mt-0.5">Organiza: {e.nombre_negocio}</p>}
                {e.descripcion && <p className="text-sm text-[#d8d8d8] mt-2">{e.descripcion}</p>}
                <div className="flex items-center justify-between mt-3">
                  {e.precio_referencial !== null ? (
                    <span className="text-sm text-white">Desde S/ {e.precio_referencial}</span>
                  ) : <span />}
                  {e.link_compra && (
                    <a href={e.link_compra} target="_blank" rel="noopener noreferrer" className="btn-primary text-white text-xs font-medium rounded-lg px-3 py-1.5">Comprar entradas</a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {userId && categoriaCuenta !== 'empresa' && (
          <Link
            href="/soy-empresa"
            className="block text-center mt-8 text-xs text-muted hover:text-accent-light transition-colors duration-180 hover:underline"
          >
            ¿Eres una promotora y quieres promocionar tu evento? →
          </Link>
        )}
      </div>
    </div>
  )
}