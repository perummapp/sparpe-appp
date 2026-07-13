export type NivelExperiencia = { value: string; label: string }

export const NIVELES_EXPERIENCIA: NivelExperiencia[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'profesional', label: 'Profesional' },
]

export function etiquetaNivel(value: string | null | undefined): string {
  if (!value) return 'Sin nivel'
  return NIVELES_EXPERIENCIA.find((n) => n.value === value)?.label ?? 'Sin nivel'
}