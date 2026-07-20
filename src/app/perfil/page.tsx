'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'
import SelectSheet from '@/components/SelectSheet'
import CapturaSelfie from '@/components/CapturaSelfie'
import { DISTRITOS } from '@/lib/distritos'
import { NIVELES_EXPERIENCIA, etiquetaNivel } from '@/lib/nivelExperiencia'
import { DISCIPLINAS } from '@/lib/disciplinas'
import { etiquetaPeso } from '@/lib/pesoRangos'

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

const ETIQUETA_TIPO: Record<string, string> = {
  peleador: 'Peleador',
  fitness: 'Fitness / Ocio',
  fan: 'Fan del deporte',
}

export default function PerfilPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [modoEdicion, setModoEdicion] = useState(false)

  const [nombre, setNombre] = useState('')
  const [tipoUsuario, setTipoUsuario] = useState('peleador')
  const [disciplina, setDisciplina] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [nivelExperiencia, setNivelExperiencia] = useState('')
  const [escuela, setEscuela] = useState('')
  const [distrito, setDistrito] = useState('')
  const [disponibleSparring, setDisponibleSparring] = useState(false)
  const [fotoUrl, setFotoUrl] = useState('')
  const [mostrarCaptura, setMostrarCaptura] = useState(false)

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
        if (perfil.tipo_usuario && DESTINOS_EMPRESA[perfil.tipo_usuario]) {
          router.push(DESTINOS_EMPRESA[perfil.tipo_usuario])
          return
        }
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
        setFotoUrl(perfil.foto_url ?? '')
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
    if (!guardarError) router.push(DESTINOS_EMPRESA[tipo])
  }

  const handleCambiarDisponible = (checked: boolean) => {
    if (checked && !fotoUrl) {
      setMostrarCaptura(true)
      return
    }
    setDisponibleSparring(checked)
  }

  const handleSubidaSelfie = (url: string) => {
    setFotoUrl(url)
    setMostrarCaptura(false)
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

    if (guardarError) {
      setMensaje('Error: ' + guardarError.message)
    } else {
      setMensaje('')
      setModoEdicion(false)
    }
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
        layout
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm card-surface rounded-2xl p-8"
      >
        <AnimatePresence mode="wait">
          {!modoEdicion ? (
            // ---------- MODO VISTA ----------
            <motion.div
              key="vista"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-24 h-24 rounded-full overflow-hidden bg-[#1e1e1e] flex items-center justify-center border border-border ${disponibleSparring ? 'halo-pulse' : ''}`}
                >
                  {fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoUrl} alt={nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-muted font-medium">{nombre.charAt(0).toUpperCase() || '?'}</span>
                  )}
                </motion.div>

                <h1 className="text-xl font-bold text-white mt-4">{nombre || 'Sin nombre'}</h1>

                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-full border border-border text-muted">
                    {ETIQUETA_TIPO[tipoUsuario] ?? tipoUsuario}
                  </span>
                  {disciplina && (
                    <span className="text-xs px-2.5 py-1 rounded-full border border-accent/40 text-accent-light">
                      {disciplina}
                    </span>
                  )}
                  {disponibleSparring && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 border border-accent text-accent-light">
                      ● Disponible para sparring
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted">Peso</span>
                  <span className="text-white">{pesoKg ? etiquetaPeso(Number(pesoKg)) : 'Sin registrar'}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted">Nivel</span>
                  <span className="text-white">{nivelExperiencia ? etiquetaNivel(nivelExperiencia) : 'Sin registrar'}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted">Escuela</span>
                  <span className="text-white">{escuela || 'Sin registrar'}</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-muted">Distrito</span>
                  <span className="text-white">{distrito || 'Sin registrar'}</span>
                </div>
              </div>

              {!fotoUrl && (
                <p className="text-xs text-accent-light text-center mb-4">
                  Agrega tu selfie verificada para poder proponer sparring.
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.09 }}
                onClick={() => setModoEdicion(true)}
                className="btn-primary w-full text-white font-medium rounded-lg py-2.5"
              >
                Editar perfil
              </motion.button>
            </motion.div>
          ) : (
            // ---------- MODO EDICIÓN ----------
            <motion.div
              key="edicion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-white">Editar perfil</h1>
                <button onClick={() => setModoEdicion(false)} className="text-sm text-muted hover:text-accent-light transition-colors duration-180">
                  Cancelar
                </button>
              </div>

              <label className={labelClass}>Foto verificada</label>
              {fotoUrl && !mostrarCaptura && (
                <div className="flex items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fotoUrl} alt="Tu selfie" className="w-14 h-14 rounded-full object-cover border border-border" />
                  <button type="button" onClick={() => setMostrarCaptura(true)} className="text-xs text-accent-light hover:underline">
                    Actualizar selfie
                  </button>
                </div>
              )}
              {(!fotoUrl || mostrarCaptura) && (
                <div className="mb-4">
                  <CapturaSelfie userId={userId} onSubida={handleSubidaSelfie} />
                </div>
              )}

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
                  type="number" step="0.1" min={PESO_MIN} max={PESO_MAX}
                  value={pesoKg} onChange={(e) => setPesoKg(e.target.value)}
                  placeholder={`Entre ${PESO_MIN} y ${PESO_MAX} kg`} className={inputClass}
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

                <label className="flex items-center gap-2 text-sm text-[#e6e6e6] mb-1 mt-1">
                  <input
                    type="checkbox"
                    checked={disponibleSparring}
                    onChange={(e) => handleCambiarDisponible(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  Estoy disponible para sparring ahora
                </label>
                {!fotoUrl && <p className="text-xs text-[#6b6b6b] mb-6">Necesitas una selfie verificada para activar esto.</p>}
                {fotoUrl && <div className="mb-6" />}

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
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}