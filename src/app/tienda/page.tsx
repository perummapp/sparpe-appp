'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'

type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  precio: number | null
  categoria: string | null
  disciplina: string | null
  imagen_url: string | null
  link_compra: string | null
  marca_id: string
  marcas: { nombre: string; rubro: string | null } | null
}

const DISCIPLINAS_TIENDA = ['Boxeo', 'MMA', 'Muay Thai', 'Jiu-Jitsu']

export default function TiendaPage() {
  const [cargando, setCargando] = useState(true)
  const [categoriaCuenta, setCategoriaCuenta] = useState('persona')
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: perfil } = await supabase.from('perfiles').select('categoria_cuenta').eq('id', userData.user.id).single()
      setCategoriaCuenta(perfil?.categoria_cuenta ?? 'persona')

      const { data: marcasVerificadas } = await supabase.from('marcas').select('id').eq('verificado', true)
      const idsVerificados = (marcasVerificadas ?? []).map((m) => m.id)

      if (idsVerificados.length > 0) {
        const { data } = await supabase
          .from('productos')
          .select('id, nombre, descripcion, precio, categoria, disciplina, imagen_url, link_compra, marca_id, marcas(nombre, rubro)')
          .eq('disponible', true)
          .in('marca_id', idsVerificados)
          .order('creado_en', { ascending: false })
        setProductos((data as unknown as Producto[]) ?? [])
      }

      setCargando(false)
    }
    cargar()
  }, [router])

  const productosFiltrados = productos.filter(
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
          Artículos deportivos y equipamiento de marcas verificadas de la comunidad.
        </p>

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

        {productosFiltrados.length === 0 && (
          <p className="text-sm text-muted">
            Todavía no hay productos publicados con esos filtros.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {productosFiltrados.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
              className="card-surface rounded-xl overflow-hidden flex flex-col"
            >
              {p.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagen_url} alt={p.nombre} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 bg-surface flex items-center justify-center text-[10px] text-[#6b6b6b]">Sin foto aún</div>
              )}
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-white text-sm font-medium leading-tight">{p.nombre}</p>
                <p className="text-xs text-muted mt-0.5">{p.categoria} · {p.disciplina}</p>
                {p.precio !== null && <p className="text-sm text-accent-light font-medium mt-1">S/ {p.precio}</p>}
                {p.link_compra && (
                  <a href={p.link_compra} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-auto pt-1.5 pb-1.5 text-xs text-center text-accent-light rounded-lg block">Comprar</a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {categoriaCuenta === 'empresa' && (
          <Link
            href="/tienda/mi-marca"
            className="block text-center mt-8 text-xs text-muted hover:text-accent-light transition-colors duration-180 hover:underline"
          >
            ¿Tienes una marca? Publícala →
          </Link>
        )}
      </div>
    </div>
  )
}
