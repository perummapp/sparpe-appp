'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import SelectSheet from '@/components/SelectSheet'
import { DISTRITOS } from '@/lib/distritos'
import { NIVELES_EXPERIENCIA } from '@/lib/nivelExperiencia'
import { DISCIPLINAS } from '@/lib/disciplinas'

const PESO_MIN = 20
const PESO_MAX = 200

const DESTINOS_EMPRESA: Record<string, string> = {
  escuela: '/escuelas/mi-escuela',
  marca: '/tienda/mi-marca',
  promotora: '/eventos/mi-evento',
}

const TIPOS_EMPRESA = [
  { value: 'escuela', label: 'Escuela / Gimnasio', emoji: '🏫', desc: 'Publica tu escuela en el directorio y tus ofertas.' },
  { value: 'marca', label: 'Marca', emoji: '🛍️', desc: 'Publica productos y ofertas en la Tienda.' },
  { value: 'promotora', label: 'Promotora de eventos', emoji: '🎟️', desc: 'Publica tus eventos en el calendario.' },
]

export default function PerfilPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipoUsuario, setTipoUsuario] = useState('peleador')
  const [disciplina, setDisciplina] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [nivelExperiencia, setNivelExperiencia] = useState('')
  const [escuela, setEscuela] = useState('')
  const [distrito, setDistrito] = useState('')
  const [disponibleSparring, setDisponibleSparring] = useState(false)
  const [necesitaTipoEmpresa, setNecesitaTipoEmpresa] = useState(false)
  const [guardandoTipo, setGuardandoTipo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', userData.user.id).single()

      if (perfil?.categoria_cuenta === 'empresa') {
        // Ya eligió su tipo de negocio antes → va directo a gestionarlo.
        if (perfil.tipo_usuario && DESTINOS_EMPRESA[perfil.tipo_usuario]) {
          router.push(DESTINOS_EMPRESA[perfil.tipo_usuario])
          return
        }
        // Es empresa pero todavía no eligió qué tipo → se lo preguntamos aquí mismo.
        setNecesitaTipoEmpresa(true)
        setCargando(false)
        return
      }

      if (perfil) {
        setNombre(perfil.nombre ?? '')
        setTipoUsuario(perfil.tipo_usuario ?? 'peleador')
        setDisciplina(perfil.disciplina ?? '')
        setPesoKg(perfil.peso_kg !== null && perfil.peso_kg !== undefined ? String(perfil.peso_kg) : '')
        setNivelExperiencia(perfil.nivel_experiencia ?? '')
        setEscuela(perfil.escuela ?? '')
        setDistrito(perfil.distrito ?? '')
        setDisponibleSparring(perfil.disponible_sparring ?? false)
      }
      setCargando(false)
    }
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleElegirTipoEmpresa = async (tipo: string) => {
    setGuardandoTipo(true)
    const { error: guardarError } = await supabase.from('perfiles').update({ tipo_usuario: tipo }).eq('id', userId)
    setGuardandoTipo(false)
    if (!guardarError) {
      router.push(DESTINOS_EMPRESA[tipo])
    }
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (pesoKg) {
      const pesoNum = Number(pesoKg)
      if (Number.isNaN(pesoNum) || pesoNum < PESO_MIN || pesoNum > PESO_MAX) {
        setError(`Ingresa un peso real, entre ${PESO_MIN} y ${PESO_MAX} kg.`)
        return
      }
    }

    setGuardando(true)

    const { error: guardarError } = await supabase.from('perfiles').upsert({
      id: userId,
      nombre,
      tipo_usuario: tipoUsuario,
      disciplina,
      peso_kg: pesoKg ? Number(pesoKg) : null,
      nivel_experiencia: nivelExperiencia || null,
      escuela,
      distrito,
      disponible_sparring: disponibleSparring,
    })

    setGuardando(false)
    setMensaje(guardarError ? 'Error: ' + guardarError.message : '¡Perfil guardado correctamente!')
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  if (necesitaTipoEmpresa) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm card-surface rounded-2xl p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Cuenta de empresa</h1>
          <p className="text-sm text-muted mb-6">
            Elige qué tipo de negocio tienes. Esta elección queda fija, así que revisa bien antes de confirmar.
          </p>
          <div className="space-y-3">
            {TIPOS_EMPRESA.map((t) => (
              <motion.button
                key={t.value}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.09 }}
                onClick={() => handleElegirTipoEmpresa(t.value)}
                disabled={guardandoTipo}
                className="btn-secondary w-full text-left rounded-xl p-4 disabled:opacity-50"
              >
                <p className="text-white font-medium">{t.emoji} {t.label}</p>
                <p className="text-xs text-muted mt-1">{t.desc}</p>
              </motion.button>
            ))}
          </div>
          {guardandoTipo && <p className="text-sm text-muted mt-4">Guardando...</p>}
        </motion.div>
      </div>
    )
  }

  const inputClass = "w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-4"
  const labelClass = "text-sm text-muted mb-1 block"

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm card-surface rounded-2xl p-8"
      >
        <h1 className="text-2xl font-bold text-white mb-6">Mi perfil</h1>
        <form onSubmit={handleGuardar}>
          <label className={labelClass}>Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClass} />

          <label className={labelClass}>¿Qué tipo de usuario eres?</label>
          <select value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)} className={inputClass}>
            <option value="peleador">Soy peleador</option>
            <option value="fitness">Entreno por fitness/ocio</option>
            <option value="fan">Sigo el deporte de contacto</option>
          </select>

          <label className={labelClass}>Disciplina</label>
          <div className="mb-4">
            <SelectSheet
              value={disciplina}
              onChange={setDisciplina}
              options={DISCIPLINAS.map((d) => ({ value: d, label: d }))}
              placeholder="Selecciona tu disciplina"
            />
          </div>

          <label className={labelClass}>Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            min={PESO_MIN}
            max={PESO_MAX}
            value={pesoKg}
            onChange={(e) => setPesoKg(e.target.value)}
            placeholder={`Entre ${PESO_MIN} y ${PESO_MAX} kg`}
            className={inputClass}
          />

          <label className={labelClass}>Nivel de experiencia</label>
          <select value={nivelExperiencia} onChange={(e) => setNivelExperiencia(e.target.value)} className={inputClass}>
            <option value="">Selecciona tu nivel</option>
            {NIVELES_EXPERIENCIA.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>

          <label className={labelClass}>Escuela/Gimnasio</label>
          <input type="text" value={escuela} onChange={(e) => setEscuela(e.target.value)} placeholder="Ej. Team Fuego Lima" className={inputClass} />

          <label className={labelClass}>Distrito</label>
          <div className="mb-4">
            <SelectSheet
              value={distrito}
              onChange={setDistrito}
              options={DISTRITOS.map((d) => ({ value: d, label: d }))}
              placeholder="Selecciona tu distrito"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#e6e6e6] mb-6 mt-1">
            <input
              type="checkbox"
              checked={disponibleSparring}
              onChange={(e) => setDisponibleSparring(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
            Estoy disponible para sparring ahora
          </label>

          {error && <p className="text-sm text-accent-light mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.09 }}
            type="submit" disabled={guardando}
            className="btn-primary w-full text-white font-medium rounded-lg py-2.5 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </motion.button>
        </form>
        {mensaje && <p className="text-sm text-accent-light mt-4">{mensaje}</p>}
      </motion.div>
    </div>
  )
}