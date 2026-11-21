'use client'

import { useState } from 'react'
import { Button } from './Button'
import { field } from './field'

/** A labelled URL with a copy button. */
export function CopyLink({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold wrap-anywhere">{label}</span>
      <div className="flex gap-2">
        <input readOnly value={url} aria-label={label} onFocus={(e) => e.target.select()} className={`${field} min-w-0 flex-1 bg-page font-mono text-sm`} />
        <Button variant="secondary" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
