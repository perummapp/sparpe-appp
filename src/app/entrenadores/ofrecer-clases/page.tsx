'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function OfrecerClasesPage() {
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState('')
  const [solicitudExistente, setSolicitudExistente] = useState<{ estado: string } | null>(null)

  const [disciplina, setDisciplina] = useState('')
  const [nivelExperiencia, setNivelExperiencia] = useState('')
  const [evidencia, setEvidencia] = useState('')
  const [contacto, setContacto] = useState('')

  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: solicitud } = await supabase
        .from('solicitudes_entrenador')
        .select('estado')
        .eq('solicitante_id', userData.user.id)
        .maybeSingle()

      setSolicitudExistente(solicitud)
      setCargando(false)
    }
    cargar()
  }, [router])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setMensaje('')

    const { data: miPerfil } = await supabase.from('perfiles').select('nombre').eq('id', userId).single()

    const { error } = await supabase.from('solicitudes_entrenador').insert({
      solicitante_id: userId,
      solicitante_nombre: miPerfil?.nombre ?? '',
      disciplina,
      nivel_experiencia: nivelExperiencia,
      evidencia,
      contacto,
      estado: 'pendiente',
    })

    setEnviando(false)

    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      setMensaje('¡Solicitud enviada!')
      setSolicitudExistente({ estado: 'pendiente' })
    }
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"

  if (solicitudExistente) {
    const textoEstado: Record<string, string> = {
      pendiente: 'Tu solicitud está en revisión.',
      aprobado: '¡Tu solicitud fue aprobada! Ya puedes publicar tu ficha en "Mi ficha de entrenador".',
      rechazado: 'Tu solicitud no fue aprobada por ahora.',
    }

    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-3">Ofrecer clases</h1>
          <p className="text-sm text-[#d8d8d8]">{textoEstado[solicitudExistente.estado] ?? textoEstado.pendiente}</p>
          <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline block mt-5">← Inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Ofrecer clases personalizadas</h1>
        <p className="text-sm text-[#9a9a9a] mb-6">
          Cuéntanos sobre tu experiencia. Revisamos cada solicitud antes de habilitar tu ficha pública de entrenador.
        </p>
        <form onSubmit={handleEnviar}>
          <label className={labelClass}>Disciplina en la que darías clases</label>
          <input type="text" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} required placeholder="Ej. Muay Thai" className={inputClass} />

          <label className={labelClass}>Nivel / experiencia</label>
          <textarea value={nivelExperiencia} onChange={(e) => setNivelExperiencia(e.target.value)} rows={2} placeholder="Ej. 6 años compitiendo amateur, 2 dando clases" className={inputClass} />

          <label className={labelClass}>Evidencia (opcional)</label>
          <input type="text" value={evidencia} onChange={(e) => setEvidencia(e.target.value)} placeholder="Link a video, Instagram, récord" className={inputClass} />

          <label className={labelClass}>Contacto</label>
          <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} required placeholder="WhatsApp o email" className={inputClass} />

          <button type="submit" disabled={enviando}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 mt-2">
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
        {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}