import { useEffect, useRef, useState } from 'react'
import { useNotesStore } from '@/store/notesStore'

interface Props {
  slug: string
  autoFocus?: boolean
}

/** Textarea that saves on blur, and after a pause in typing.
 *  Callers pass key={slug} so switching regions remounts with a fresh draft. */
export default function NoteEditor({ slug, autoFocus }: Props) {
  const saved = useNotesStore((s) => s.notes[slug] ?? '')
  const setNote = useNotesStore((s) => s.setNote)
  const [draft, setDraft] = useState(saved)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const scheduleSave = (value: string) => {
    setDraft(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setNote(slug, value), 800)
  }

  const saveNow = () => {
    clearTimeout(timer.current)
    if (draft.trim() !== saved) setNote(slug, draft)
  }

  return (
    <textarea
      value={draft}
      autoFocus={autoFocus}
      onChange={(e) => scheduleSave(e.target.value)}
      onBlur={saveNow}
      placeholder="Why this place? Things to do, people to see…"
      rows={3}
      className="w-full resize-y rounded-lg border border-off-black/30 bg-cream px-2 py-1.5 text-xs leading-snug focus:border-red focus:outline-none"
    />
  )
}
