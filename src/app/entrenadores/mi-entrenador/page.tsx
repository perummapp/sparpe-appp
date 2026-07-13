'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import SelectSheet from '@/components/SelectSheet'
import { DISCIPLINAS } from '@/lib/disciplinas'
import { DISTRITOS } from '@/lib/distritos'

export default function MiEntrenadorPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState('')
  const [verificado, setVerificado] = useState(false)
  const [verificacionSolicitada, setVerificacionSolicitada] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [distrito, setDistrito] = useState('')
  const [contacto, setContacto] = useState('')

  const router = useRouter()

  const cargarFicha = async (uid: string) => {
    const { data: entrenador } = await supabase.from('entrenadores').select('*').eq('id', uid).single()
    if (entrenador) {
      setNombre(entrenador.nombre ?? '')
      setEspecialidad(entrenador.especialidad ?? '')
      setDescripcion(entrenador.descripcion ?? '')
      setTarifa(entrenador.tarifa ?? '')
      setDistrito(entrenador.distrito ?? '')
      setContacto(entrenador.contacto ?? '')
      setVerificado(entrenador.verificado ?? false)
      setVerificacionSolicitada(entrenador.verificacion_solicitada ?? null)
    }
  }

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)
      await cargarFicha(userData.user.id)
      setCargando(false)
    }
    cargarDatos()
  }, [router])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('entrenadores').upsert({
      id: userId,
      nombre,
      especialidad,
      descripcion,
      tarifa,
      distrito,
      contacto,
    })

    setGuardando(false)
    setMensaje(error ? 'Error: ' + error.message : '¡Ficha guardada! Queda pendiente de verificación antes de verse en el directorio público.')
    if (!error) await cargarFicha(userId)
  }

  const handleSolicitarVerificacion = async () => {
    const ahora = new Date().toISOString()
    const { error } = await supabase.from('entrenadores').update({ verificacion_solicitada: ahora }).eq('id', userId)
    if (!error) await cargarFicha(userId)
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"
  const tengoFicha = nombre !== ''

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Mi ficha de entrenador</h1>
          <Link href="/entrenadores" className="text-sm text-[#e29b9b] hover:underline">← Volver</Link>
        </div>
        <p className="text-sm text-[#9a9a9a] mb-6">
          Cualquiera puede llenar esta ficha. Se verifica antes de aparecer en el directorio público, para que la comunidad confíe en quién ofrece clases.
        </p>

        {tengoFicha && (
          <div className="mb-6 text-sm">
            {verificado ? (
              <p className="text-[#7fd1a3]">✓ Verificado — visible en el directorio público.</p>
            ) : verificacionSolicitada ? (
              <p className="text-[#9a9a9a]">Verificación solicitada, en revisión.</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[#9a9a9a]">Sin verificar — no visible en el directorio.</p>
                <button
                  onClick={handleSolicitarVerificacion}
                  className="shrink-0 bg-[#a32d2d] hover:bg-[#8f2626] text-white text-xs rounded-lg px-3 py-1.5 transition"
                >
                  Solicitar verificación
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleGuardar}>
          <label className={labelClass}>Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Tu nombre o el de tu marca personal" className={inputClass} />

          <label className={labelClass}>Especialidad</label>
          <div className="mb-4">
            <SelectSheet
              value={especialidad}
              onChange={setEspecialidad}
              options={DISCIPLINAS.map((d) => ({ value: d, label: d }))}
              placeholder="Selecciona tu especialidad"
            />
          </div>

          <label className={labelClass}>Distrito donde entrenas</label>
          <div className="mb-4">
            <SelectSheet
              value={distrito}
              onChange={setDistrito}
              options={DISTRITOS.map((d) => ({ value: d, label: d }))}
              placeholder="Selecciona tu distrito"
            />
          </div>

          <label className={labelClass}>Tarifa (opcional)</label>
          <input type="text" value={tarifa} onChange={(e) => setTarifa(e.target.value)} placeholder="Ej. S/ 50 por clase" className={inputClass} />

          <label className={labelClass}>Contacto (WhatsApp, IG, etc.)</label>
          <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej. 987654321 o @usuario" className={inputClass} />

          <label className={labelClass}>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Cuéntale a la comunidad tu experiencia y estilo de enseñanza" className={inputClass} />

          <button type="submit" disabled={guardando}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 mt-2">
            {guardando ? 'Guardando...' : 'Guardar ficha'}
          </button>
        </form>
        {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}