'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Option = { value: string; label: string }

type SelectSheetProps = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
}

export default function SelectSheet({ value, onChange, options, placeholder }: SelectSheetProps) {
  const [abierto, setAbierto] = useState(false)
  const seleccionado = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="input-glow w-full flex items-center justify-between bg-[#1e1e1e] border border-border rounded-lg px-3 py-2 text-sm text-left"
      >
        <span className={value ? 'text-white' : 'text-[#6b6b6b]'}>
          {seleccionado ? seleccionado.label : (placeholder || 'Selecciona')}
        </span>
        <ChevronDown size={16} className="text-muted" />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="card-surface absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-xl p-2">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setAbierto(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-180 ${
                  o.value === value ? 'bg-accent text-white' : 'text-[#d8d8d8] hover:bg-[#262626]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}