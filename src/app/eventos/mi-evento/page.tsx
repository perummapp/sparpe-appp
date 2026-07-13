'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import DatePicker from '@/components/DatePicker'
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
  verificado: boolean
  verificacion_solicitada: string | null
  activo: boolean
}

export default function MiEventoPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [eventos, setEventos] = useState<Evento[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [nombreNegocio, setNombreNegocio] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [fecha, setFecha] = useState('')
  const [sede, setSede] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [precioReferencial, setPrecioReferencial] = useState('')
  const [linkCompra, setLinkCompra] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')

  const router = useRouter()

  const cargarEventos = async (uid: string) => {
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('promotora_id', uid)
      .order('fecha', { ascending: false })

    const lista = (data as Evento[]) ?? []
    setEventos(lista)
    if (lista.length > 0 && !nombreNegocio) {
      setNombreNegocio(lista[0].nombre_negocio ?? '')
    }
  }

  useEffect(() => {
    const iniciar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('categoria_cuenta')
        .eq('id', userData.user.id)
        .single()

      if (perfil?.categoria_cuenta !== 'empresa') {
        router.push('/soy-empresa')
        return
      }

      setUserId(userData.user.id)
      await cargarEventos(userData.user.id)
      setCargando(false)
    }
    iniciar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleAgregarEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('eventos').insert({
      promotora_id: userId,
      nombre_negocio: nombreNegocio || null,
      titulo,
      descripcion: descripcion || null,
      disciplina: disciplina || null,
      fecha,
      sede: sede || null,
      ciudad: ciudad || null,
      precio_referencial: precioReferencial ? Number(precioReferencial) : null,
      link_compra: linkCompra || null,
      imagen_url: imagenUrl || null,
    })

    setGuardando(false)

    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      setTitulo(''); setDescripcion(''); setDisciplina(''); setFecha('')
      setSede(''); setCiudad(''); setPrecioReferencial(''); setLinkCompra(''); setImagenUrl('')
      setMostrarForm(false)
      await cargarEventos(userId)
    }
  }

  const handleSolicitarVerificacion = async (id: string) => {
    await supabase
      .from('eventos')
      .update({ verificacion_solicitada: new Date().toISOString() })
      .eq('id', id)
    await cargarEventos(userId)
  }

  const handleEliminarEvento = async (id: string) => {
    await supabase.from('eventos').delete().eq('id', id)
    await cargarEventos(userId)
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mis eventos</h1>
          <Link href="/eventos" className="text-sm text-[#e29b9b] hover:underline">← Eventos</Link>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-[#9a9a9a] uppercase tracking-wide">Publicados</h2>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="text-sm text-[#e29b9b] hover:underline">
            {mostrarForm ? 'Cancelar' : '+ Publicar evento'}
          </button>
        </div>

        {mostrarForm && (
          <form onSubmit={handleAgregarEvento} className="bg-[#161616] border border-[#262626] rounded-xl p-4 mb-5">
            <label className={labelClass}>Nombre de tu promotora/negocio</label>
            <input type="text" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} required placeholder="Ej. Combate Perú Promotions" className={inputClass} />

            <label className={labelClass}>Título del evento</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ej. Noche de título" className={inputClass} />

            <label className={labelClass}>Disciplina</label>
            <div className="mb-4">
              <SelectSheet
                value={disciplina}
                onChange={setDisciplina}
                options={DISCIPLINAS.map((d) => ({ value: d, label: d }))}
                placeholder="Selecciona la disciplina"
              />
            </div>

            <label className={labelClass}>Fecha</label>
            <div className="mb-4">
              <DatePicker value={fecha} onChange={setFecha} placeholder="Selecciona la fecha" />
            </div>

            <label className={labelClass}>Sede</label>
            <input type="text" value={sede} onChange={(e) => setSede(e.target.value)} placeholder="Ej. Lima Boxing Arena" className={inputClass} />

            <label className={labelClass}>Ciudad</label>
            <div className="mb-4">
              <SelectSheet
                value={ciudad}
                onChange={setCiudad}
                options={CIUDADES.map((c) => ({ value: c, label: c }))}
                placeholder="Selecciona la ciudad"
              />
            </div>

            <label className={labelClass}>Precio referencial (opcional)</label>
            <input type="number" step="0.01" value={precioReferencial} onChange={(e) => setPrecioReferencial(e.target.value)} placeholder="En soles" className={inputClass} />

            <label className={labelClass}>Link de compra (opcional)</label>
            <input type="text" value={linkCompra} onChange={(e) => setLinkCompra(e.target.value)} className={inputClass} />

            <label className={labelClass}>URL de imagen (opcional)</label>
            <input type="text" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} className={inputClass} />

            <label className={labelClass}>Descripción (opcional)</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={inputClass} />

            {mensaje && <p className="text-sm text-[#e29b9b] mb-3">{mensaje}</p>}

            <button type="submit" disabled={guardando}
              className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Publicar evento'}
            </button>
          </form>
        )}

        {eventos.length === 0 && !mostrarForm && (
          <p className="text-sm text-[#9a9a9a]">Todavía no publicaste ningún evento.</p>
        )}

        <div className="space-y-3">
          {eventos.map((ev) => {
            const estado = ev.verificado
              ? { texto: 'Verificado', color: 'text-green-400' }
              : ev.verificacion_solicitada
                ? { texto: 'En revisión', color: 'text-amber-400' }
                : { texto: 'No verificado', color: 'text-[#9a9a9a]' }

            return (
              <div key={ev.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
                <p className="text-white font-medium">{ev.titulo}</p>
                <p className="text-sm text-[#9a9a9a] mt-1">
                  {ev.fecha} · {ev.ciudad || 'Sin ciudad'} · {ev.disciplina || 'Sin disciplina'}
                </p>
                <p className={`text-sm mt-1 font-medium ${estado.color}`}>{estado.texto}</p>

                <div className="flex gap-3 mt-3">
                  {!ev.verificado && !ev.verificacion_solicitada && (
                    <button onClick={() => handleSolicitarVerificacion(ev.id)} className="text-sm text-[#e29b9b] hover:underline">
                      Solicitar verificación
                    </button>
                  )}
                  <button onClick={() => handleEliminarEvento(ev.id)} className="text-sm text-[#e29b9b] hover:underline">
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}