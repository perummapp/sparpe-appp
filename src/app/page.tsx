'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getUser()
      router.replace(data.user ? '/inicio' : '/login')
    }
    verificar()
  }, [router])

  return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
}