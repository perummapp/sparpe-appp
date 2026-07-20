'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
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
  const [modoEdicion, setModoEdicion] = useState(false)

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

    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      setMensaje('')
      setModoEdicion(false)
    }
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
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-4"
  const labelClass = "text-sm text-muted mb-1 block"
  const chipClass = (activo: boolean) =>
    `shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-180 ${
      activo ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-[#3a3a3a]'
    }`

  const estadoBadge = verificado
    ? { texto: '✓ Verificada', clase: 'text-[#7fd1a3] border-[#2e7d4f] bg-[rgba(46,125,79,0.1)]' }
    : verificacionSolicitada
      ? { texto: 'En revisión', clase: 'text-amber-400 border-amber-400/40 bg-amber-400/10' }
      : { texto: 'No verificada', clase: 'text-muted border-border' }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mi negocio</h1>
          <Link href="/tienda" className="text-sm text-accent-light hover:underline">← Tienda</Link>
        </div>

        <motion.div layout transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="card-surface rounded-2xl p-6 mb-6">
          <AnimatePresence mode="wait">
            {!modoEdicion ? (
              <motion.div key="vista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full border border-border text-muted">🛍️ Marca</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${estadoBadge.clase}`}>{estadoBadge.texto}</span>
                </div>

                <h2 className="text-xl font-bold text-white">{nombre || 'Sin nombre'}</h2>
                {rubro && <p className="text-sm text-muted mt-0.5">{rubro}</p>}
                {descripcion && <p className="text-sm text-[#d8d8d8] mt-3">{descripcion}</p>}
                {contacto && <p className="text-xs text-muted mt-3">{contacto}</p>}

                {!verificado && !verificacionSolicitada && (
                  <motion.button
                    whileTap={{ scale: 0.98 }} transition={{ duration: 0.09 }}
                    onClick={handleSolicitarVerificacion} disabled={solicitando}
                    className="btn-secondary w-full text-sm text-white rounded-lg py-2 mt-4 disabled:opacity-50"
                  >
                    {solicitando ? 'Enviando...' : 'Solicitar verificación'}
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }} transition={{ duration: 0.09 }}
                  onClick={() => setModoEdicion(true)}
                  className="btn-primary w-full text-white font-medium rounded-lg py-2.5 mt-3"
                >
                  Editar mi negocio
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="edicion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">Editar negocio</h2>
                  <button onClick={() => setModoEdicion(false)} className="text-sm text-muted hover:text-accent-light transition-colors duration-180">Cancelar</button>
                </div>

                <form onSubmit={handleGuardarMarca}>
                  <label className={labelClass}>Nombre de la marca</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Everlast Perú" className={inputClass} />

                  <label className={labelClass}>Rubro</label>
                  <input type="text" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder="Ej. Guantes y equipamiento" className={inputClass} />

                  <label className={labelClass}>Contacto (WhatsApp, IG, web)</label>
                  <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej. 987654321 o @marca" className={inputClass} />

                  <label className={labelClass}>Descripción</label>
                  <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Cuéntale a la comunidad qué vende tu marca" className={inputClass} />

                  <motion.button
                    whileTap={{ scale: 0.98 }} transition={{ duration: 0.09 }}
                    type="submit" disabled={guardando}
                    className="btn-primary w-full text-white font-medium rounded-lg py-2.5 disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </motion.button>
                </form>
                {mensaje && <p className="text-sm text-accent-light mt-4">{mensaje}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {nombre && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-muted uppercase tracking-wide">Mis productos</h2>
              <button onClick={() => setMostrarFormProducto(!mostrarFormProducto)} className="text-sm text-accent-light hover:underline">
                {mostrarFormProducto ? 'Cancelar' : '+ Agregar producto'}
              </button>
            </div>

            {mostrarFormProducto && (
              <form onSubmit={handleAgregarProducto} className="card-surface rounded-xl p-4 mb-4">
                <input type="text" value={pNombre} onChange={(e) => setPNombre(e.target.value)} required placeholder="Nombre del producto" className={inputClass} />

                <p className="text-xs text-[#6b6b6b] mb-1">Categoría</p>
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
                  {CATEGORIAS_PRODUCTO.map((c) => {
                    const activo = pCategoria === c
                    return (
                      <button key={c} type="button" onClick={() => setPCategoria(activo ? '' : c)} className={chipClass(activo)}>
                        {c}
                      </button>
                    )
                  })}
                </div>

                <input type="number" step="0.01" value={pPrecio} onChange={(e) => setPPrecio(e.target.value)} placeholder="Precio en soles (opcional)" className={inputClass} />
                <input type="text" value={pImagenUrl} onChange={(e) => setPImagenUrl(e.target.value)} placeholder="URL de imagen (opcional)" className={inputClass} />
                <input type="text" value={pLinkCompra} onChange={(e) => setPLinkCompra(e.target.value)} placeholder="Link para comprar (opcional)" className={inputClass} />
                <textarea value={pDescripcion} onChange={(e) => setPDescripcion(e.target.value)} rows={2} placeholder="Descripción (opcional)" className={inputClass} />
                <motion.button whileTap={{ scale: 0.98 }} transition={{ duration: 0.09 }} type="submit" disabled={guardandoProducto}
                  className="btn-primary w-full text-white text-sm font-medium rounded-lg py-2 disabled:opacity-50">
                  {guardandoProducto ? 'Guardando...' : 'Publicar producto'}
                </motion.button>
              </form>
            )}

            {productos.length === 0 && !mostrarFormProducto && (
              <p className="text-sm text-muted">Todavía no publicaste ningún producto.</p>
            )}

            <div className="space-y-2">
              {productos.map((p) => (
                <div key={p.id} className="card-surface rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted">{p.categoria || '—'}{p.precio !== null ? ` · S/ ${p.precio}` : ''}</p>
                  </div>
                  <button onClick={() => handleEliminarProducto(p.id)} className="text-xs text-accent-light hover:underline">
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
              <h2 className="text-sm text-muted uppercase tracking-wide">Mis ofertas</h2>
              <button onClick={() => setMostrarFormOferta(!mostrarFormOferta)} className="text-sm text-accent-light hover:underline">
                {mostrarFormOferta ? 'Cancelar' : '+ Agregar oferta'}
              </button>
            </div>

            {mostrarFormOferta && (
              <form onSubmit={handleAgregarOferta} className="card-surface rounded-xl p-4 mb-4">
                <input type="text" value={oTitulo} onChange={(e) => setOTitulo(e.target.value)} required placeholder="Título (ej. 20% dcto en guantes)" className={inputClass} />
                <textarea value={oDescripcion} onChange={(e) => setODescripcion(e.target.value)} rows={2} placeholder="Descripción (opcional)" className={inputClass} />
                <DatePicker value={oVigenteHasta} onChange={setOVigenteHasta} placeholder="Vigente hasta (opcional)" />
                <motion.button whileTap={{ scale: 0.98 }} transition={{ duration: 0.09 }} type="submit" disabled={guardandoOferta}
                  className="btn-primary w-full text-white text-sm font-medium rounded-lg py-2 mt-3 disabled:opacity-50">
                  {guardandoOferta ? 'Guardando...' : 'Publicar oferta'}
                </motion.button>
              </form>
            )}

            {ofertas.length === 0 && !mostrarFormOferta && (
              <p className="text-sm text-muted">Todavía no publicaste ninguna oferta.</p>
            )}

            <div className="space-y-2">
              {ofertas.map((o) => (
                <div key={o.id} className="card-surface rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{o.titulo}</p>
                    {o.vigente_hasta && <p className="text-xs text-muted">Hasta {o.vigente_hasta}</p>}
                  </div>
                  <button onClick={() => handleEliminarOferta(o.id)} className="text-xs text-accent-light hover:underline">
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