'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

const CATEGORIAS = [
  { value: 'escuela', label: 'Escuela / gimnasio' },
  { value: 'marca', label: 'Marca de artículos deportivos' },
  { value: 'promotora', label: 'Promotora de eventos' },
]

export default function SoyEmpresaPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const [nombreNegocio, setNombreNegocio] = useState('')
  const [categoria, setCategoria] = useState('escuela')
  const [nombreContacto, setNombreContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')

  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)
      setCargando(false)
    }
    cargar()
  }, [router])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!telefono && !correo) {
      setError('Déjanos al menos un teléfono o un correo para poder contactarte.')
      return
    }

    setEnviando(true)

    const { error: insertError } = await supabase.from('solicitudes_empresa').insert({
      usuario_id: userId,
      nombre_negocio: nombreNegocio,
      categoria,
      nombre_contacto: nombreContacto,
      telefono: telefono || null,
      correo: correo || null,
      mensaje: mensaje || null,
    })

    setEnviando(false)

    if (insertError) {
      setError('Error: ' + insertError.message)
    } else {
      setEnviado(true)
    }
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>

        <h1 className="text-2xl font-bold text-white mt-2 mb-2">Soy empresa</h1>
        <p className="text-sm text-[#9a9a9a] mb-4">
          Para escuelas, marcas de artículos deportivos y promotoras de eventos que quieren llegar a la comunidad de SparPe.
        </p>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 mb-6">
          <p className="text-xs text-[#9a9a9a] uppercase tracking-wide mb-2">Qué ganas al unirte</p>
          <ul className="text-sm text-[#d8d8d8] space-y-1.5 list-disc list-inside">
            <li>Apareces en el directorio verificado de SparPe</li>
            <li>Publicas tus productos, ofertas o eventos directamente a la comunidad</li>
            <li>Badge de verificado, que da confianza a quien te encuentra</li>
          </ul>
        </div>

        {enviado ? (
          <div className="bg-[#161616] border border-[#262626] rounded-xl p-5 text-center mb-6">
            <p className="text-[#7fd1a3] font-medium mb-1">¡Solicitud enviada!</p>
            <p className="text-sm text-[#9a9a9a]">
              Revisamos tu información y te contactamos por el medio que dejaste. Si prefieres adelantarte, también puedes escribirnos directo abajo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="bg-[#161616] border border-[#262626] rounded-2xl p-6 mb-6">
            <label className={labelClass}>Nombre del negocio</label>
            <input type="text" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} required placeholder="Ej. Team Fuego Lima" className={inputClass} />

            <label className={labelClass}>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <label className={labelClass}>Tu nombre</label>
            <input type="text" value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)} required placeholder="Quién eres tú, no el negocio" className={inputClass} />

            <label className={labelClass}>Teléfono / WhatsApp</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 987654321" className={inputClass} />

            <label className={labelClass}>Correo</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Ej. contacto@negocio.com" className={inputClass} />

            <p className="text-xs text-[#6b6b6b] -mt-2 mb-4">Déjanos al menos uno de los dos.</p>

            <label className={labelClass}>Cuéntanos brevemente de tu negocio (opcional)</label>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} placeholder="Qué ofreces, dónde, hace cuánto operas..." className={inputClass} />

            {error && <p className="text-sm text-[#e29b9b] mb-3">{error}</p>}

            <button type="submit" disabled={enviando}
              className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50">
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        )}

        <div className="text-center">
          <p className="text-xs text-[#6b6b6b] mb-2">¿Prefieres escribirnos directo?</p>
          <a href="mailto:perummapp@gmail.com" className="text-sm text-[#e29b9b] hover:underline">
            perummapp@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}