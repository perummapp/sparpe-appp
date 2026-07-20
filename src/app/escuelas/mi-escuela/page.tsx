'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import DatePicker from '@/components/DatePicker'
import SelectSheet from '@/components/SelectSheet'
import { DISCIPLINAS } from '@/lib/disciplinas'
import { DISTRITOS } from '@/lib/distritos'

type Oferta = {
  id: string
  titulo: string
  descripcion: string | null
  vigente_hasta: string | null
}

export default function MiEscuelaPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState('')
  const [modoEdicion, setModoEdicion] = useState(false)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState<string[]>([])
  const [distrito, setDistrito] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [verificado, setVerificado] = useState(false)
  const [verificacionSolicitada, setVerificacionSolicitada] = useState<string | null>(null)
  const [solicitando, setSolicitando] = useState(false)

  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [oTitulo, setOTitulo] = useState('')
  const [oDescripcion, setODescripcion] = useState('')
  const [oVigenteHasta, setOVigenteHasta] = useState('')
  const [guardandoOferta, setGuardandoOferta] = useState(false)

  const router = useRouter()

  const cargarOfertas = async (escuelaId: string) => {
    const { data } = await supabase.from('ofertas').select('*').eq('propietario_id', escuelaId).eq('propietario_tipo', 'escuela').order('creado_en', { ascending: false })
    setOfertas(data ?? [])
  }

  const toggleDisciplina = (d: string) => {
    setDisciplinasSeleccionadas((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil } = await supabase.from('perfiles').select('categoria_cuenta').eq('id', userData.user.id).single()
      if (perfil?.categoria_cuenta !== 'empresa') { router.push('/soy-empresa'); return }

      const { data: escuela } = await supabase.from('escuelas').select('*').eq('id', userData.user.id).single()
      if (escuela) {
        setNombre(escuela.nombre ?? '')
        setDescripcion(escuela.descripcion ?? '')
        const lista = (escuela.disciplinas ?? '')
          .split(',')
          .map((d: string) => d.trim())
          .filter((d: string) => d.length > 0)
        setDisciplinasSeleccionadas(lista)
        setDistrito(escuela.distrito ?? '')
        setDireccion(escuela.direccion ?? '')
        setTelefono(escuela.telefono ?? '')
        setVerificado(escuela.verificado ?? false)
        setVerificacionSolicitada(escuela.verificacion_solicitada ?? null)
        await cargarOfertas(userData.user.id)
      }
      setCargando(false)
    }
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('escuelas').upsert({
      id: userId,
      nombre,
      descripcion,
      disciplinas: disciplinasSeleccionadas.join(', '),
      distrito,
      direccion,
      telefono,
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
    const { error } = await supabase.from('escuelas').update({ verificacion_solicitada: ahora }).eq('id', userId)
    setSolicitando(false)
    if (!error) setVerificacionSolicitada(ahora)
  }

  const handleAgregarOferta = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoOferta(true)

    const { error } = await supabase.from('ofertas').insert({
      propietario_id: userId,
      propietario_tipo: 'escuela',
      nombre_negocio: nombre,
      titulo: oTitulo,
      descripcion: oDescripcion || null,
      vigente_hasta: oVigenteHasta || null,
    })

    setGuardandoOferta(false)

    if (!error) {
      setOTitulo(''); setODescripcion(''); setOVigenteHasta('')
      setMostrarForm(false)
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
          <Link href="/escuelas" className="text-sm text-accent-light hover:underline">← Directorio</Link>
        </div>

        <motion.div layout transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="card-surface rounded-2xl p-6 mb-6">
          <AnimatePresence mode="wait">
            {!modoEdicion ? (
              <motion.div key="vista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full border border-border text-muted">🏫 Escuela</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${estadoBadge.clase}`}>{estadoBadge.texto}</span>
                </div>

                <h2 className="text-xl font-bold text-white">{nombre || 'Sin nombre'}</h2>
                {distrito && <p className="text-sm text-muted mt-0.5">{distrito}</p>}

                {disciplinasSeleccionadas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {disciplinasSeleccionadas.map((d) => (
                      <span key={d} className="text-xs px-2.5 py-1 rounded-full border border-accent/40 text-accent-light">{d}</span>
                    ))}
                  </div>
                )}

                {descripcion && <p className="text-sm text-[#d8d8d8] mt-3">{descripcion}</p>}
                {(direccion || telefono) && (
                  <p className="text-xs text-muted mt-3">
                    {direccion}{direccion && telefono ? ' · ' : ''}{telefono}
                  </p>
                )}

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

                <form onSubmit={handleGuardar}>
                  <label className={labelClass}>Nombre de la escuela/gimnasio</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Team Fuego Lima" className={inputClass} />

                  <label className={labelClass}>Disciplinas que enseña</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {DISCIPLINAS.map((d) => {
                      const seleccionada = disciplinasSeleccionadas.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDisciplina(d)}
                          className={`text-xs rounded-full px-3 py-1.5 border transition-all duration-180 ${
                            seleccionada ? 'bg-accent border-accent text-white' : 'bg-surface border-border text-muted'
                          }`}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>

                  <label className={labelClass}>Distrito</label>
                  <div className="mb-4">
                    <SelectSheet
                      value={distrito}
                      onChange={setDistrito}
                      options={DISTRITOS.map((d) => ({ value: d, label: d }))}
                      placeholder="Selecciona el distrito"
                    />
                  </div>

                  <label className={labelClass}>Dirección (opcional)</label>
                  <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Av. Larco 123" className={inputClass} />

                  <label className={labelClass}>Teléfono / WhatsApp (opcional)</label>
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 987654321" className={inputClass} />

                  <label className={labelClass}>Descripción breve</label>
                  <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Cuéntale a la comunidad de qué se trata tu escuela" className={inputClass} />

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
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-muted uppercase tracking-wide">Mis ofertas</h2>
              <button onClick={() => setMostrarForm(!mostrarForm)} className="text-sm text-accent-light hover:underline">
                {mostrarForm ? 'Cancelar' : '+ Agregar oferta'}
              </button>
            </div>

            {mostrarForm && (
              <form onSubmit={handleAgregarOferta} className="card-surface rounded-xl p-4 mb-4">
                <input type="text" value={oTitulo} onChange={(e) => setOTitulo(e.target.value)} required placeholder="Título (ej. Primera clase gratis)" className={inputClass} />
                <textarea value={oDescripcion} onChange={(e) => setODescripcion(e.target.value)} rows={2} placeholder="Descripción (opcional)" className={inputClass} />
                <DatePicker value={oVigenteHasta} onChange={setOVigenteHasta} placeholder="Vigente hasta (opcional)" />
                <motion.button whileTap={{ scale: 0.98 }} transition={{ duration: 0.09 }} type="submit" disabled={guardandoOferta}
                  className="btn-primary w-full text-white text-sm font-medium rounded-lg py-2 mt-3 disabled:opacity-50">
                  {guardandoOferta ? 'Guardando...' : 'Publicar oferta'}
                </motion.button>
              </form>
            )}

            {ofertas.length === 0 && !mostrarForm && (
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