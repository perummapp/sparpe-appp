'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import DatePicker from '@/components/DatePicker'
import SelectSheet from '@/components/SelectSheet'
import { RANGOS_PESO, etiquetaPeso, pesoEnRango } from '@/lib/pesoRangos'
import { NIVELES_EXPERIENCIA, etiquetaNivel } from '@/lib/nivelExperiencia'
import { DISTRITOS } from '@/lib/distritos'

type Fighter = {
  id: string
  nombre: string
  disciplina: string | null
  peso_kg: number | null
  nivel_experiencia: string | null
  escuela: string | null
  distrito: string | null
}

const DISCIPLINAS = ['Boxeo', 'Muay Thai', 'MMA', 'Kickboxing', 'Jiu-Jitsu', 'Judo', 'Karate', 'Taekwondo']

export default function SparringPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [userNombre, setUserNombre] = useState('')
  const [userFotoUrl, setUserFotoUrl] = useState('')
  const [fighters, setFighters] = useState<Fighter[]>([])

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

      const { data } = await supabase
        .from('perfiles')
        .select('id, nombre, disciplina, peso_kg, nivel_experiencia, escuela, distrito')
        .eq('tipo_usuario', 'sparring')
        .eq('disponible_sparring', true)
        .neq('id', userData.user.id)

      setFighters(data ?? [])
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
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d]"
  const chipClass = (activo: boolean) =>
    `shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
      activo ? 'bg-[#a32d2d] border-[#a32d2d] text-white' : 'border-[#333] text-[#9a9a9a] hover:border-[#555]'
    }`

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>

        <div className="flex items-center justify-between mb-1 mt-2">
          <h1 className="text-2xl font-bold text-white">Buscar sparring</h1>
          <Link href="/solicitudes" className="text-sm text-[#e29b9b] hover:underline">Ver solicitudes</Link>
        </div>
        <p className="text-sm text-[#9a9a9a] mb-4">
          Solo se muestran peleadores marcados como &quot;disponibles para sparring&quot; en su perfil.
        </p>

        {!userFotoUrl && (
          <div className="bg-[#161616] border border-[#a32d2d]/40 rounded-xl p-3 mb-4">
            <p className="text-sm text-[#e29b9b]">
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

        {confirmacion && <p className="text-sm text-[#e29b9b] mb-4">{confirmacion}</p>}

        {fightersFiltrados.length === 0 && (
          <p className="text-sm text-[#9a9a9a]">
            Nadie disponible con esos filtros por ahora. Prueba dejando los filtros en blanco, o revisa que tu segunda cuenta de prueba tenga marcado &quot;disponible para sparring&quot; en su perfil.
          </p>
        )}

        <div className="space-y-3">
          {fightersFiltrados.map((f) => (
            <div key={f.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
              <p className="text-white font-medium">{f.nombre}</p>
              <p className="text-sm text-[#9a9a9a] mt-1">
                {f.disciplina || '—'} · {etiquetaNivel(f.nivel_experiencia)} · {etiquetaPeso(f.peso_kg)}
              </p>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                {f.escuela || 'Sin escuela'} · {f.distrito || 'Sin distrito'}
              </p>

              {abiertoId !== f.id && userFotoUrl && (
                <button
                  onClick={() => setAbiertoId(f.id)}
                  className="mt-3 bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm rounded-lg px-3 py-1.5 transition"
                >
                  Proponer sparring
                </button>
              )}

              {abiertoId === f.id && (
                <div className="mt-3 border-t border-[#262626] pt-3 space-y-2">
                  <DatePicker value={fechaPropuesta} onChange={setFechaPropuesta} placeholder="Fecha propuesta" />
                  <input type="text" placeholder="Gimnasio o lugar (opcional)" value={gimnasioPropuesto} onChange={(e) => setGimnasioPropuesto(e.target.value)} className={inputClass} />
                  <p className="text-xs text-[#6b6b6b] -mt-1">Puedes dejarlo en blanco y coordinar el lugar directamente por chat.</p>
                  <textarea placeholder="Mensaje (opcional)" value={mensajePropuesta} onChange={(e) => setMensajePropuesta(e.target.value)} className={inputClass} rows={2} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProponer(f)}
                      disabled={enviando}
                      className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                    >
                      {enviando ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                    <button
                      onClick={() => setAbiertoId(null)}
                      className="border border-[#333] text-[#9a9a9a] text-sm rounded-lg px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}