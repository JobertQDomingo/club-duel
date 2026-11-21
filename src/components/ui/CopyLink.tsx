'use client'

import { useState } from 'react'
import { Button } from './Button'

/** A labelled URL with a copy button. */
export function CopyLink({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-sm font-bold uppercase tracking-wide">{label}</span>
      <div className="flex gap-2">
        <input readOnly value={url} aria-label={label} onFocus={(e) => e.target.select()} className="min-h-11 min-w-0 flex-1 border border-ink bg-sheet px-3 font-mono text-sm" />
        <Button variant="secondary" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
