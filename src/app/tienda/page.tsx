'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'

// Catálogo temporal simulado. Ningún dato de esta lista viene de la base
// de datos ni representa una marca real — es solo para dar volumen visual
// a la sección mientras se suman marcas verificadas de verdad. Cuando la
// primera marca se registre, esto se reemplaza por el query real a
// `productos`/`marcas` (el mismo patrón que ya existe en /escuelas).
type ProductoSimulado = {
  nombre: string
  categoria: string
  disciplina: string
  precio: number
  color: string
}

const PRODUCTOS_SIMULADOS: ProductoSimulado[] = [
  { nombre: 'Guantes de boxeo 12oz', categoria: 'Guantes', disciplina: 'Boxeo', precio: 149, color: '#5a1414' },
  { nombre: 'Vendas de mano 4.5m', categoria: 'Protección', disciplina: 'Boxeo', precio: 25, color: '#3a2f10' },
  { nombre: 'Espinilleras MMA', categoria: 'Protección', disciplina: 'MMA', precio: 119, color: '#1d3d33' },
  { nombre: 'Guantes de MMA (grappling)', categoria: 'Guantes', disciplina: 'MMA', precio: 89, color: '#1d3d33' },
  { nombre: 'Short de Muay Thai', categoria: 'Ropa', disciplina: 'Muay Thai', precio: 79, color: '#4a1414' },
  { nombre: 'Coderas y rodilleras Muay Thai', categoria: 'Protección', disciplina: 'Muay Thai', precio: 65, color: '#4a1414' },
  { nombre: 'Gi de Jiu-Jitsu', categoria: 'Ropa', disciplina: 'Jiu-Jitsu', precio: 229, color: '#2a2a4a' },
  { nombre: 'Rashguard manga larga', categoria: 'Ropa', disciplina: 'Jiu-Jitsu', precio: 99, color: '#2a2a4a' },
  { nombre: 'Casco de sparring', categoria: 'Protección', disciplina: 'Boxeo', precio: 139, color: '#5a1414' },
  { nombre: 'Bucal deportivo doble', categoria: 'Protección', disciplina: 'MMA', precio: 35, color: '#1d3d33' },
]

const DISCIPLINAS_TIENDA = ['Boxeo', 'MMA', 'Muay Thai', 'Jiu-Jitsu']

export default function TiendaPage() {
  const [cargando, setCargando] = useState(true)
  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setCargando(false)
    }
    cargar()
  }, [router])

  const productosFiltrados = PRODUCTOS_SIMULADOS.filter(
    (p) => filtroDisciplina === '' || p.disciplina === filtroDisciplina
  )

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  const chipClass = (activo: boolean) =>
    `shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-180 ${
      activo ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-[#3a3a3a]'
    }`

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Tienda</h1>
          <Link href="/inicio" className="text-sm text-accent-light hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-muted mb-5">
          Catálogo de muestra de artículos de contacto. Todavía no hay marcas verificadas publicando aquí.
        </p>

        <Link
          href="/tienda/mi-marca"
          className="btn-primary block w-full text-center text-white text-sm font-medium rounded-lg py-2.5 mb-6"
        >
          + Publicar mi marca
        </Link>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          <button type="button" onClick={() => setFiltroDisciplina('')} className={chipClass(filtroDisciplina === '')}>
            Todas
          </button>
          {DISCIPLINAS_TIENDA.map((d) => (
            <button key={d} type="button" onClick={() => setFiltroDisciplina(filtroDisciplina === d ? '' : d)} className={chipClass(filtroDisciplina === d)}>
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {productosFiltrados.map((p, index) => (
            <motion.div
              key={p.nombre}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
              className="card-surface rounded-xl overflow-hidden flex flex-col"
            >
              <div className="w-full h-24" style={{ backgroundColor: p.color }} />
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-white text-sm font-medium leading-tight">{p.nombre}</p>
                <p className="text-xs text-muted mt-0.5">{p.categoria} · {p.disciplina}</p>
                <p className="text-sm text-accent-light font-medium mt-1">S/ {p.precio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
