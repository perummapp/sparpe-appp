'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import DatePicker from '@/components/DatePicker'
import { CATEGORIAS_PRODUCTO } from '@/lib/categoriasProducto'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  precio: number | null
}

type Oferta = {
  id: string
  titulo: string
  descripcion: string | null
  vigente_hasta: string | null
}

export default function MiMarcaPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState('')

  const [nombre, setNombre] = useState('')
  const [rubro, setRubro] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [contacto, setContacto] = useState('')
  const [verificado, setVerificado] = useState(false)
  const [verificacionSolicitada, setVerificacionSolicitada] = useState<string | null>(null)
  const [solicitando, setSolicitando] = useState(false)

  const [productos, setProductos] = useState<Producto[]>([])
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false)
  const [pNombre, setPNombre] = useState('')
  const [pDescripcion, setPDescripcion] = useState('')
  const [pPrecio, setPPrecio] = useState('')
  const [pCategoria, setPCategoria] = useState('')
  const [pImagenUrl, setPImagenUrl] = useState('')
  const [pLinkCompra, setPLinkCompra] = useState('')
  const [guardandoProducto, setGuardandoProducto] = useState(false)

  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [mostrarFormOferta, setMostrarFormOferta] = useState(false)
  const [oTitulo, setOTitulo] = useState('')
  const [oDescripcion, setODescripcion] = useState('')
  const [oVigenteHasta, setOVigenteHasta] = useState('')
  const [guardandoOferta, setGuardandoOferta] = useState(false)

  const router = useRouter()

  const cargarProductos = async (marcaId: string) => {
    const { data } = await supabase.from('productos').select('id, nombre, categoria, precio').eq('marca_id', marcaId).order('creado_en', { ascending: false })
    setProductos(data ?? [])
  }

  const cargarOfertas = async (marcaId: string) => {
    const { data } = await supabase.from('ofertas').select('*').eq('propietario_id', marcaId).eq('propietario_tipo', 'marca').order('creado_en', { ascending: false })
    setOfertas(data ?? [])
  }

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil } = await supabase.from('perfiles').select('categoria_cuenta').eq('id', userData.user.id).single()
      if (perfil?.categoria_cuenta !== 'empresa') { router.push('/soy-empresa'); return }

      const { data: marca } = await supabase.from('marcas').select('*').eq('id', userData.user.id).single()
      if (marca) {
        setNombre(marca.nombre ?? '')
        setRubro(marca.rubro ?? '')
        setDescripcion(marca.descripcion ?? '')
        setContacto(marca.contacto ?? '')
        setVerificado(marca.verificado ?? false)
        setVerificacionSolicitada(marca.verificacion_solicitada ?? null)
        await cargarProductos(userData.user.id)
        await cargarOfertas(userData.user.id)
      }
      setCargando(false)
    }
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleGuardarMarca = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('marcas').upsert({
      id: userId,
      nombre,
      rubro,
      descripcion,
      contacto,
    })

    setGuardando(false)
    setMensaje(error ? 'Error: ' + error.message : '¡Marca guardada correctamente!')
  }

  const handleSolicitarVerificacion = async () => {
    setSolicitando(true)
    const ahora = new Date().toISOString()
    const { error } = await supabase.from('marcas').update({ verificacion_solicitada: ahora }).eq('id', userId)
    setSolicitando(false)
    if (!error) setVerificacionSolicitada(ahora)
  }

  const handleAgregarProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoProducto(true)

    const { error } = await supabase.from('productos').insert({
      marca_id: userId,
      nombre: pNombre,
      descripcion: pDescripcion || null,
      precio: pPrecio ? Number(pPrecio) : null,
      categoria: pCategoria || null,
      imagen_url: pImagenUrl || null,
      link_compra: pLinkCompra || null,
    })

    setGuardandoProducto(false)

    if (!error) {
      setPNombre(''); setPDescripcion(''); setPPrecio(''); setPCategoria(''); setPImagenUrl(''); setPLinkCompra('')
      setMostrarFormProducto(false)
      await cargarProductos(userId)
    }
  }

  const handleEliminarProducto = async (id: string) => {
    await supabase.from('productos').delete().eq('id', id)
    await cargarProductos(userId)
  }

  const handleAgregarOferta = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoOferta(true)

    const { error } = await supabase.from('ofertas').insert({
      propietario_id: userId,
      propietario_tipo: 'marca',
      nombre_negocio: nombre,
      titulo: oTitulo,
      descripcion: oDescripcion || null,
      vigente_hasta: oVigenteHasta || null,
    })

    setGuardandoOferta(false)

    if (!error) {
      setOTitulo(''); setODescripcion(''); setOVigenteHasta('')
      setMostrarFormOferta(false)
      await cargarOfertas(userId)
    }
  }

  const handleEliminarOferta = async (id: string) => {
    await supabase.from('ofertas').delete().eq('id', id)
    await cargarOfertas(userId)
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"
  const chipClass = (activo: boolean) =>
    `shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
      activo ? 'bg-[#a32d2d] border-[#a32d2d] text-white' : 'border-[#333] text-[#9a9a9a] hover:border-[#555]'
    }`

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mi marca</h1>
          <Link href="/tienda" className="text-sm text-[#e29b9b] hover:underline">← Tienda</Link>
        </div>

        {nombre && (
          <div className="mb-6 rounded-xl border p-4 text-sm"
            style={{
              borderColor: verificado ? '#2e7d4f' : '#333',
              backgroundColor: verificado ? 'rgba(46,125,79,0.1)' : '#161616',
            }}
          >
            {verificado ? (
              <p className="text-[#7fd1a3] font-medium">✓ Marca verificada — ya apareces en la tienda pública.</p>
            ) : verificacionSolicitada ? (
              <p className="text-[#9a9a9a]">Verificación solicitada, en revisión por el equipo de SparPe.</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[#9a9a9a]">Todavía no verificada — tus productos no se ven en la tienda pública hasta que lo esté.</p>
                <button
                  onClick={handleSolicitarVerificacion}
                  disabled={solicitando}
                  className="shrink-0 bg-[#a32d2d] hover:bg-[#8f2626] text-white text-xs rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                >
                  {solicitando ? 'Enviando...' : 'Solicitar verificación'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 mb-6">
          <form onSubmit={handleGuardarMarca}>
            <label className={labelClass}>Nombre de la marca</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Everlast Perú" className={inputClass} />

            <label className={labelClass}>Rubro</label>
            <input type="text" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder="Ej. Guantes y equipamiento" className={inputClass} />

            <label className={labelClass}>Contacto (WhatsApp, IG, web)</label>
            <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej. 987654321 o @marca" className={inputClass} />

            <label className={labelClass}>Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Cuéntale a la comunidad qué vende tu marca" className={inputClass} />

            <button type="submit" disabled={guardando}
              className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 mt-2">
              {guardando ? 'Guardando...' : 'Guardar marca'}
            </button>
          </form>
          {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
        </div>

        {nombre && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide">Mis productos</h2>
              <button onClick={() => setMostrarFormProducto(!mostrarFormProducto)} className="text-sm text-[#e29b9b] hover:underline">
                {mostrarFormProducto ? 'Cancelar' : '+ Agregar producto'}
              </button>
            </div>

            {mostrarFormProducto && (
              <form onSubmit={handleAgregarProducto} className="bg-[#161616] border border-[#262626] rounded-xl p-4 mb-4">
                <input type="text" value={pNombre} onChange={(e) => setPNombre(e.target.value)} required placeholder="Nombre del producto" className={inputClass} />

                <p className="text-xs text-[#6b6b6b] mb-1">Categoría</p>
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
                  {CATEGORIAS_PRODUCTO.map((c) => {
                    const activo = pCategoria === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPCategoria(activo ? '' : c)}
                        className={chipClass(activo)}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>

                <input type="number" step="0.01" value={pPrecio} onChange={(e) => setPPrecio(e.target.value)} placeholder="Precio en soles (opcional)" className={inputClass} />
                <input type="text" value={pImagenUrl} onChange={(e) => setPImagenUrl(e.target.value)} placeholder="URL de imagen (opcional)" className={inputClass} />
                <input type="text" value={pLinkCompra} onChange={(e) => setPLinkCompra(e.target.value)} placeholder="Link para comprar (opcional)" className={inputClass} />
                <textarea value={pDescripcion} onChange={(e) => setPDescripcion(e.target.value)} rows={2} placeholder="Descripción (opcional)" className={inputClass} />
                <button type="submit" disabled={guardandoProducto}
                  className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2 transition disabled:opacity-50">
                  {guardandoProducto ? 'Guardando...' : 'Publicar producto'}
                </button>
              </form>
            )}

            {productos.length === 0 && !mostrarFormProducto && (
              <p className="text-sm text-[#9a9a9a]">Todavía no publicaste ningún producto.</p>
            )}

            <div className="space-y-2">
              {productos.map((p) => (
                <div key={p.id} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-[#9a9a9a]">{p.categoria || '—'}{p.precio !== null ? ` · S/ ${p.precio}` : ''}</p>
                  </div>
                  <button onClick={() => handleEliminarProducto(p.id)} className="text-xs text-[#e29b9b] hover:underline">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {nombre && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide">Mis ofertas</h2>
              <button onClick={() => setMostrarFormOferta(!mostrarFormOferta)} className="text-sm text-[#e29b9b] hover:underline">
                {mostrarFormOferta ? 'Cancelar' : '+ Agregar oferta'}
              </button>
            </div>

            {mostrarFormOferta && (
              <form onSubmit={handleAgregarOferta} className="bg-[#161616] border border-[#262626] rounded-xl p-4 mb-4">
                <input type="text" value={oTitulo} onChange={(e) => setOTitulo(e.target.value)} required placeholder="Título (ej. 20% dcto en guantes)" className={inputClass} />
                <textarea value={oDescripcion} onChange={(e) => setODescripcion(e.target.value)} rows={2} placeholder="Descripción (opcional)" className={inputClass} />
                <DatePicker value={oVigenteHasta} onChange={setOVigenteHasta} placeholder="Vigente hasta (opcional)" />
                <button type="submit" disabled={guardandoOferta}
                  className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2 transition disabled:opacity-50 mt-3">
                  {guardandoOferta ? 'Guardando...' : 'Publicar oferta'}
                </button>
              </form>
            )}

            {ofertas.length === 0 && !mostrarFormOferta && (
              <p className="text-sm text-[#9a9a9a]">Todavía no publicaste ninguna oferta.</p>
            )}

            <div className="space-y-2">
              {ofertas.map((o) => (
                <div key={o.id} className="bg-[#161616] border border-[#262626] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{o.titulo}</p>
                    {o.vigente_hasta && <p className="text-xs text-[#9a9a9a]">Hasta {o.vigente_hasta}</p>}
                  </div>
                  <button onClick={() => handleEliminarOferta(o.id)} className="text-xs text-[#e29b9b] hover:underline">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}