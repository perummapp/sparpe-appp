'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  precio: number | null
  categoria: string | null
  imagen_url: string | null
  link_compra: string | null
  marca_id: string
  marcas: { nombre: string; rubro: string | null } | null
}

type Oferta = {
  id: string
  nombre_negocio: string | null
  titulo: string
  descripcion: string | null
  vigente_hasta: string | null
}

export default function TiendaPage() {
  const [cargando, setCargando] = useState(true)
  const [productos, setProductos] = useState<Producto[]>([])
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [tengoMarca, setTengoMarca] = useState(false)
  const [userId, setUserId] = useState('')
  const [categoriaCuenta, setCategoriaCuenta] = useState<string | null>(null)

  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? ''
      setUserId(uid)

      if (uid) {
        const { data: perfil } = await supabase.from('perfiles').select('categoria_cuenta').eq('id', uid).single()
        setCategoriaCuenta(perfil?.categoria_cuenta ?? null)

        const { data: miMarca } = await supabase.from('marcas').select('id').eq('id', uid).single()
        setTengoMarca(!!miMarca)
      }

      const { data: marcasVerificadas } = await supabase.from('marcas').select('id').eq('verificado', true)
      const idsVerificados = (marcasVerificadas ?? []).map((m) => m.id)

      if (idsVerificados.length > 0) {
        const { data } = await supabase
          .from('productos')
          .select('*, marcas(nombre, rubro)')
          .eq('disponible', true)
          .in('marca_id', idsVerificados)
          .order('creado_en', { ascending: false })
        setProductos((data as unknown as Producto[]) ?? [])

        const { data: ofertasData } = await supabase
          .from('ofertas')
          .select('id, nombre_negocio, titulo, descripcion, vigente_hasta')
          .eq('propietario_tipo', 'marca')
          .eq('activa', true)
          .in('propietario_id', idsVerificados)
          .order('creado_en', { ascending: false })
        setOfertas(ofertasData ?? [])
      }

      setCargando(false)
    }
    cargar()
  }, [])

  const productosFiltrados = productos.filter((p) => {
    const okCategoria = filtroCategoria === '' || (p.categoria ?? '').toLowerCase().includes(filtroCategoria.toLowerCase())
    const okMarca = filtroMarca === '' || (p.marcas?.nombre ?? '').toLowerCase().includes(filtroMarca.toLowerCase())
    return okCategoria && okMarca
  })

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d]"

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Tienda</h1>
          <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-[#9a9a9a] mb-5">
          Artículos deportivos y equipamiento de marcas verificadas de la comunidad.
        </p>

        {!userId && (
          <Link
            href="/login"
            className="block w-full text-center border border-[#333] text-[#9a9a9a] text-sm font-medium rounded-lg py-2.5 mb-6 transition hover:border-[#a32d2d]"
          >
            Inicia sesión para publicar tu marca
          </Link>
        )}

        {userId && categoriaCuenta === 'empresa' && (
          <Link
            href="/tienda/mi-marca"
            className="block w-full text-center bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2.5 mb-6 transition"
          >
            {tengoMarca ? 'Administrar mi marca y productos' : '+ Publicar mi marca'}
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
          <input placeholder="Categoría" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={inputClass} />
          <input placeholder="Marca" value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className={inputClass} />
        </div>

        {productosFiltrados.length === 0 && (
          <p className="text-sm text-[#9a9a9a]">
            Todavía no hay productos publicados con esos filtros.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {productosFiltrados.map((p) => (
            <div key={p.id} className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden flex flex-col">
              {p.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagen_url} alt={p.nombre} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-[#1e1e1e] flex items-center justify-center text-[#6b6b6b] text-xs">Sin imagen</div>
              )}
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-white text-sm font-medium leading-tight">{p.nombre}</p>
                <p className="text-xs text-[#9a9a9a] mt-0.5">{p.marcas?.nombre ?? 'Marca'}</p>
                {p.precio !== null && <p className="text-sm text-[#e29b9b] font-medium mt-1">S/ {p.precio}</p>}
                {p.link_compra && (
                  <a href={p.link_compra} target="_blank" rel="noopener noreferrer"
                    className="mt-auto pt-2 text-xs text-center border border-[#a32d2d] text-[#e29b9b] rounded-lg py-1.5 hover:bg-[#a32d2d] hover:text-white transition block">
                    Comprar
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {userId && categoriaCuenta !== 'empresa' && (
          <Link
            href="/soy-empresa"
            className="block text-center mt-8 text-xs text-[#9a9a9a] hover:text-[#e29b9b] hover:underline"
          >
            ¿Eres una empresa y quieres vender tus artículos? Publica tu marca aquí →
          </Link>
        )}
      </div>
    </div>
  )
}