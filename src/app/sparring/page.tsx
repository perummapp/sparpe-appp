'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import DatePicker from '@/components/DatePicker'
import SelectSheet from '@/components/SelectSheet'
import { RANGOS_PESO, etiquetaPeso, pesoEnRango } from '@/lib/pesoRangos'
import { NIVELES_EXPERIENCIA, etiquetaNivel } from '@/lib/nivelExperiencia'
import { DISTRITOS } from '@/lib/distritos'

type Fighter = {
  id: string
  nombre: string
  foto_url: string | null
  disciplina: string | null
  peso_kg: number | null
  nivel_experiencia: string | null
  escuela: string | null
  distrito: string | null
}

type Rating = { calificacion_promedio: number; total_resenas: number }

const DISCIPLINAS = ['Boxeo', 'Muay Thai', 'MMA', 'Kickboxing', 'Jiu-Jitsu', 'Judo', 'Karate', 'Taekwondo']

export default function SparringPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [userNombre, setUserNombre] = useState('')
  const [userFotoUrl, setUserFotoUrl] = useState('')
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map())

  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroPeso, setFiltroPeso] = useState('')
  const [filtroDistrito, setFiltroDistrito] = useState('')

  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const [fechaPropuesta, setFechaPropuesta] = useState('')
  const [gimnasioPropuesto, setGimnasioPropuesto] = useState('')
  const [mensajePropuesta, setMensajePropuesta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')

  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: miPerfil } = await supabase.from('perfiles').select('nombre, foto_url').eq('id', userData.user.id).single()
      setUserNombre(miPerfil?.nombre ?? '')
      setUserFotoUrl(miPerfil?.foto_url ?? '')

      const { data: fightersData } = await supabase
        .from('perfiles')
        .select('id, nombre, foto_url, disciplina, peso_kg, nivel_experiencia, escuela, distrito')
        .eq('disponible_sparring', true)
        .neq('id', userData.user.id)

      const listaFighters = fightersData ?? []
      setFighters(listaFighters)

      if (listaFighters.length > 0) {
        const ids = listaFighters.map((f) => f.id)
        const { data: ratingsData } = await supabase
          .from('ranking_comunidad')
          .select('id, calificacion_promedio, total_resenas')
          .in('id', ids)

        setRatings(new Map((ratingsData ?? []).map((r) => [r.id, r])))
      }

      setCargando(false)
    }
    cargar()
  }, [router])

  const fightersFiltrados = fighters.filter((f) => {
    const okDisciplina = filtroDisciplina === '' || (f.disciplina ?? '').toLowerCase().includes(filtroDisciplina.toLowerCase())
    const okNivel = filtroNivel === '' || f.nivel_experiencia === filtroNivel
    const okPeso = filtroPeso === '' || pesoEnRango(f.peso_kg, filtroPeso)
    const okDistrito = filtroDistrito === '' || f.distrito === filtroDistrito
    return okDisciplina && okNivel && okPeso && okDistrito
  })

  const handleProponer = async (fighter: Fighter) => {
    setEnviando(true)
    setConfirmacion('')

    const { error } = await supabase.from('solicitudes_sparring').insert({
      solicitante_id: userId,
      solicitante_nombre: userNombre,
      receptor_id: fighter.id,
      receptor_nombre: fighter.nombre,
      fecha_propuesta: fechaPropuesta,
      gimnasio_propuesto: gimnasioPropuesto,
      mensaje: mensajePropuesta,
      estado: 'pendiente',
    })

    setEnviando(false)

    if (error) {
      setConfirmacion('Error: ' + error.message)
    } else {
      setConfirmacion(`¡Solicitud enviada a ${fighter.nombre}!`)
      setAbiertoId(null)
      setFechaPropuesta('')
      setGimnasioPropuesto('')
      setMensajePropuesta('')
    }
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-accent transition-colors duration-180"
  const chipClass = (activo: boolean) =>
    `shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-180 ${
      activo ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-[#3a3a3a]'
    }`

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <Link href="/inicio" className="text-sm text-accent-light hover:underline">← Inicio</Link>

        <div className="flex items-center justify-between mb-1 mt-2">
          <h1 className="text-2xl font-bold text-white">Buscar sparring</h1>
          <Link href="/solicitudes" className="text-sm text-accent-light hover:underline">Ver solicitudes</Link>
        </div>
        <p className="text-sm text-muted mb-4">
          Solo se muestran peleadores marcados como &quot;disponibles para sparring&quot; en su perfil.
        </p>

        {!userFotoUrl && (
          <div className="bg-surface border border-accent/40 rounded-xl p-3 mb-4">
            <p className="text-sm text-accent-light">
              Necesitas una selfie verificada en tu perfil antes de proponer sparring.{' '}
              <Link href="/perfil" className="underline">Completar en mi perfil →</Link>
            </p>
          </div>
        )}

        <p className="text-xs text-[#6b6b6b] mb-1">Disciplina</p>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
          {['Todas', ...DISCIPLINAS].map((d) => {
            const valor = d === 'Todas' ? '' : d
            const activo = filtroDisciplina === valor
            return (
              <button key={d} type="button" onClick={() => setFiltroDisciplina(activo ? '' : valor)} className={chipClass(activo)}>
                {d}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-[#6b6b6b] mb-1">Nivel</p>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
          <button type="button" onClick={() => setFiltroNivel('')} className={chipClass(filtroNivel === '')}>
            Todos
          </button>
          {NIVELES_EXPERIENCIA.map((n) => {
            const activo = filtroNivel === n.value
            return (
              <button key={n.value} type="button" onClick={() => setFiltroNivel(activo ? '' : n.value)} className={chipClass(activo)}>
                {n.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <SelectSheet
            value={filtroPeso}
            onChange={setFiltroPeso}
            options={[{ value: '', label: 'Todos los pesos' }, ...RANGOS_PESO]}
            placeholder="Peso"
          />
          <SelectSheet
            value={filtroDistrito}
            onChange={setFiltroDistrito}
            options={[{ value: '', label: 'Todos los distritos' }, ...DISTRITOS.map((d) => ({ value: d, label: d }))]}
            placeholder="Distrito"
          />
        </div>

        {confirmacion && <p className="text-sm text-accent-light mb-4">{confirmacion}</p>}

        {fightersFiltrados.length === 0 && (
          <p className="text-sm text-muted">
            Nadie disponible con esos filtros por ahora. Prueba ajustando los filtros, o vuelve a revisar más tarde.
          </p>
        )}

        <div className="space-y-3">
          {fightersFiltrados.map((f, index) => {
            const rating = ratings.get(f.id)
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-full halo-pulse overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
                    {f.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.foto_url} alt={f.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-muted font-medium">{f.nombre.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-medium truncate">{f.nombre}</p>
                      {rating && rating.total_resenas > 0 && (
                        <span className="shrink-0 text-xs text-accent-light">★ {rating.calificacion_promedio.toFixed(1)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {f.disciplina || '—'} · {etiquetaNivel(f.nivel_experiencia)} · {etiquetaPeso(f.peso_kg)}
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5">
                      {f.escuela || 'Sin escuela'} · {f.distrito || 'Sin distrito'}
                    </p>
                  </div>
                </div>

                {abiertoId !== f.id && userFotoUrl && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.09 }}
                    onClick={() => setAbiertoId(f.id)}
                    className="mt-3 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg px-3 py-1.5 transition-colors duration-180"
                  >
                    Proponer sparring
                  </motion.button>
                )}

                {abiertoId === f.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="mt-3 border-t border-border pt-3 space-y-2 overflow-hidden"
                  >
                    <DatePicker value={fechaPropuesta} onChange={setFechaPropuesta} placeholder="Fecha propuesta" />
                    <input type="text" placeholder="Gimnasio o lugar (opcional)" value={gimnasioPropuesto} onChange={(e) => setGimnasioPropuesto(e.target.value)} className={inputClass} />
                    <p className="text-xs text-[#6b6b6b] -mt-1">Puedes dejarlo en blanco y coordinar el lugar directamente por chat.</p>
                    <textarea placeholder="Mensaje (opcional)" value={mensajePropuesta} onChange={(e) => setMensajePropuesta(e.target.value)} className={inputClass} rows={2} />
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.09 }}
                        onClick={() => handleProponer(f)}
                        disabled={enviando}
                        className="bg-accent hover:bg-accent-hover text-white text-sm rounded-lg px-3 py-1.5 transition-colors duration-180 disabled:opacity-50"
                      >
                        {enviando ? 'Enviando...' : 'Enviar solicitud'}
                      </motion.button>
                      <button
                        onClick={() => setAbiertoId(null)}
                        className="border border-border text-muted text-sm rounded-lg px-3 py-1.5"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
