'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import SelectSheet from '@/components/SelectSheet'
import { DISTRITOS } from '@/lib/distritos'
import { NIVELES_EXPERIENCIA } from '@/lib/nivelExperiencia'
import { DISCIPLINAS } from '@/lib/disciplinas'

const PESO_MIN = 20
const PESO_MAX = 200

export default function PerfilPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipoUsuario, setTipoUsuario] = useState('sparring')
  const [disciplina, setDisciplina] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [nivelExperiencia, setNivelExperiencia] = useState('')
  const [escuela, setEscuela] = useState('')
  const [distrito, setDistrito] = useState('')
  const [disponibleSparring, setDisponibleSparring] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', userData.user.id).single()

      if (perfil?.categoria_cuenta === 'empresa') {
        const destinos: Record<string, string> = {
          escuela: '/escuelas/mi-escuela',
          marca: '/tienda/mi-marca',
          promotora: '/eventos/mi-evento',
        }
        router.push(destinos[perfil.tipo_usuario ?? ''] ?? '/soy-empresa')
        return
      }

      if (perfil) {
        setNombre(perfil.nombre ?? '')
        setTipoUsuario(perfil.tipo_usuario ?? 'sparring')
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

    // No se incluye categoria_cuenta aquí a propósito: esta pantalla ya redirige
    // a las cuentas empresa antes de llegar aquí, así que guardar el perfil
    // personal nunca debería tocar ni pisar ese valor.
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
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Mi perfil</h1>
        <form onSubmit={handleGuardar}>
          <label className={labelClass}>Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClass} />

          <label className={labelClass}>¿Qué tipo de usuario eres?</label>
          <select value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)} className={inputClass}>
            <option value="sparring">Busco sparring</option>
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
              className="w-4 h-4 accent-[#a32d2d]"
            />
            Estoy disponible para sparring ahora
          </label>

          {error && <p className="text-sm text-[#e29b9b] mb-4">{error}</p>}

          <button type="submit" disabled={guardando}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
        {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}