'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, Search } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Peleador = {
  id: string
  nombre: string
  disciplina: string | null
  peso_kg: number | null
  nivel_experiencia: string | null
  escuela: string | null
  distrito: string | null
  disponible_sparring: boolean | null
}

export default function PeleadorPublicoPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [peleador, setPeleador] = useState<Peleador | null>(null)
  const [siguiendo, setSiguiendo] = useState(false)
  const [totalSeguidores, setTotalSeguidores] = useState(0)
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const peleadorId = params.id as string

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, nombre, disciplina, peso_kg, nivel_experiencia, escuela, distrito, disponible_sparring')
        .eq('id', peleadorId)
        .single()

      if (perfilError || !perfil) {
        setError('No se encontró este peleador.')
        setCargando(false)
        return
      }
      setPeleador(perfil)

      const { data: seguido } = await supabase
        .from('seguidores_peleador')
        .select('id')
        .eq('peleador_id', peleadorId)
        .eq('seguidor_id', userData.user.id)
        .maybeSingle()
      setSiguiendo(!!seguido)

      const { count } = await supabase
        .from('seguidores_peleador')
        .select('id', { count: 'exact', head: true })
        .eq('peleador_id', peleadorId)
      setTotalSeguidores(count ?? 0)

      setCargando(false)
    }
    cargar()
  }, [router, peleadorId])

  const toggleSeguir = async () => {
    if (siguiendo) {
      await supabase.from('seguidores_peleador').delete().eq('peleador_id', peleadorId).eq('seguidor_id', userId)
      setSiguiendo(false)
      setTotalSeguidores((n) => n - 1)
    } else {
      await supabase.from('seguidores_peleador').insert({ peleador_id: peleadorId, seguidor_id: userId })
      setSiguiendo(true)
      setTotalSeguidores((n) => n + 1)
    }
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[#e29b9b] mb-4">{error}</p>
        <Link href="/inicio" className="text-[#e29b9b] hover:underline text-sm">← Inicio</Link>
      </div>
    )
  }

  const esUnoMismo = peleador!.id === userId

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 mt-3">
          <h1 className="text-xl font-bold text-white">{peleador!.nombre}</h1>
          <p className="text-sm text-[#9a9a9a] mt-1">
            {peleador!.disciplina || '—'} · {peleador!.peso_kg ? `${peleador!.peso_kg} kg` : 'Sin peso'} · {peleador!.nivel_experiencia || 'Sin nivel'}
          </p>
          <p className="text-sm text-[#9a9a9a] mt-1">{peleador!.escuela || 'Sin escuela'} · {peleador!.distrito || 'Sin distrito'}</p>

          {peleador!.disponible_sparring && (
            <span className="inline-block mt-2 text-[10px] uppercase tracking-wide text-[#e29b9b] border border-[#a32d2d] rounded px-1.5 py-0.5">
              Disponible para sparring
            </span>
          )}

          <div className="flex items-center gap-1 text-sm text-[#9a9a9a] mt-3">
            <Users size={14} /> {totalSeguidores} seguidores
          </div>

          <div className="flex gap-2 mt-3">
            {!esUnoMismo && (
              <button onClick={toggleSeguir}
                className={`text-sm rounded-lg px-3 py-1.5 transition ${siguiendo ? 'border border-[#333] text-[#9a9a9a]' : 'bg-[#a32d2d] hover:bg-[#8f2626] text-white'}`}>
                {siguiendo ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
            {!esUnoMismo && peleador!.disponible_sparring && (
              <Link href="/sparring" className="flex items-center gap-1 text-sm border border-[#333] text-[#e6e6e6] rounded-lg px-3 py-1.5">
                <Search size={14} /> Buscar sparring
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}