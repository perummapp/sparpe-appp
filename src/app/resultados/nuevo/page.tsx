'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import DatePicker from '@/components/DatePicker'

type PerfilOption = { id: string; nombre: string }

export default function NuevoResultadoPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState('')
  const [esProfesional, setEsProfesional] = useState(false)
  const [perfiles, setPerfiles] = useState<PerfilOption[]>([])

  const [rivalId, setRivalId] = useState('')
  const [fecha, setFecha] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [categoriaPeso, setCategoriaPeso] = useState('')
  const [resultado, setResultado] = useState('gane')
  const [contexto, setContexto] = useState('amateur')

  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('es_profesional')
        .eq('id', userData.user.id)
        .single()

      const profesional = perfil?.es_profesional ?? false
      setEsProfesional(profesional)

      if (profesional) {
        const { data: listaPerfiles } = await supabase
          .from('perfiles')
          .select('id, nombre')
          .eq('tipo_usuario', 'peleador')
          .neq('id', userData.user.id)

        setPerfiles(listaPerfiles ?? [])
      }

      setCargando(false)
    }
    cargar()
  }, [router])

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const perfilRival = perfiles.find((p) => p.id === rivalId)

    const { error } = await supabase.from('resultados').insert({
      peleador_id: userId,
      rival_id: rivalId || null,
      rival_nombre: perfilRival ? perfilRival.nombre : 'Rival no registrado',
      fecha,
      disciplina,
      categoria_peso: categoriaPeso,
      resultado,
      contexto,
      estado: 'pendiente',
    })

    setGuardando(false)
    setMensaje(error ? 'Error: ' + error.message : '¡Resultado cargado! Queda pendiente de confirmación.')
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  if (!esProfesional) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-3">Cargar resultado de combate</h1>
          <p className="text-sm text-[#9a9a9a] mb-6">
            Esta sección es solo para peleadores con trayectoria profesional o amateur verificada.
          </p>
          <Link
            href="/resultados/solicitar-profesional"
            className="block w-full text-center bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2.5 transition"
          >
            Solicitar acceso
          </Link>
          <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline block mt-5">← Inicio</Link>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
  const labelClass = "text-sm text-[#9a9a9a] mb-1 block"

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Cargar resultado de combate</h1>
        <form onSubmit={handleGuardar}>
          <label className={labelClass}>Rival</label>
          <select value={rivalId} onChange={(e) => setRivalId(e.target.value)} className={inputClass}>
            <option value="">-- Selecciona a tu rival --</option>
            {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <p className="text-xs text-[#6b6b6b] -mt-3 mb-4">Solo se muestran cuentas registradas como &quot;peleador&quot;. Si tu rival no aparece, aún no está registrado así en la plataforma.</p>

          <label className={labelClass}>Fecha del combate</label>
          <div className="mb-4">
            <DatePicker value={fecha} onChange={setFecha} placeholder="Fecha del combate" />
          </div>

          <label className={labelClass}>Disciplina</label>
          <input type="text" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} placeholder="Ej. Muay Thai" className={inputClass} />

          <label className={labelClass}>Categoría de peso</label>
          <input type="text" value={categoriaPeso} onChange={(e) => setCategoriaPeso(e.target.value)} placeholder="Ej. 70kg" className={inputClass} />

          <label className={labelClass}>Resultado</label>
          <select value={resultado} onChange={(e) => setResultado(e.target.value)} className={inputClass}>
            <option value="gane">Gané</option>
            <option value="perdida">Perdí</option>
            <option value="empate">Empate</option>
          </select>

          <label className={labelClass}>Contexto</label>
          <select value={contexto} onChange={(e) => setContexto(e.target.value)} className={inputClass}>
            <option value="amateur">Amateur</option>
            <option value="evento">Evento de promotora</option>
          </select>

          <button type="submit" disabled={guardando}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 mt-2">
            {guardando ? 'Guardando...' : 'Cargar resultado'}
          </button>
        </form>
        {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
      </div>
    </div>
  )
}