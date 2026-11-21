'use client'

import { useEffect, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react'
import { LiveDot } from './Badge'

export type Tab = { id: string; label: string; live?: boolean; content: ReactNode }

const onHash = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}

/**
 * One page, sections as tabs. Inactive panels stay mounted (hidden), so a half-built
 * lineup or an open picker survives a switch and a live refresh; the URL hash keeps
 * the tab across reloads and shared links.
 */
export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const hash = useSyncExternalStore(onHash, () => location.hash.slice(1), () => '')
  const active = tabs.some((t) => t.id === hash) ? hash : tabs[0].id
  // a tab cut off on a narrow phone (opened by click, key or a #link) slides to the middle of the strip; the page itself never scrolls
  useEffect(() => {
    const tab = document.getElementById(`tab-${active}`)
    const list = tab?.parentElement
    if (tab && list) list.scrollLeft = tab.offsetLeft - list.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2
  }, [active])

  function select(id: string) {
    history.replaceState(null, '', `#${id}`) // replace, not push: Back leaves the page instead of cycling tabs
    dispatchEvent(new HashChangeEvent('hashchange'))
  }
  function onKey(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active)
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const id = tabs[(next + tabs.length) % tabs.length].id
    select(id)
    document.getElementById(`tab-${id}`)?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 bg-page px-4 py-2">
        <div
          role="tablist"
          aria-label={label}
          onKeyDown={onKey}
          className="flex gap-0.5 overflow-x-auto rounded-2xl bg-ink/[0.06] p-1 [scrollbar-width:none] sm:w-fit sm:gap-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              aria-controls={`panel-${t.id}`}
              tabIndex={t.id === active ? 0 : -1}
              onClick={() => select(t.id)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-[0.8125rem] font-semibold sm:gap-2 sm:px-5 sm:text-sm text-ink-soft transition-[background-color,color,box-shadow] duration-200 hover:text-ink aria-selected:bg-card aria-selected:text-ink aria-selected:shadow-[0_1px_3px_rgb(17_24_39/0.12)] sm:flex-none"
            >
              {t.label}
              {t.live && <LiveDot />}
              {t.live && <span className="sr-only">(live)</span>}
            </button>
          ))}
        </div>
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          className="flex min-w-0 animate-[panel-in_240ms_var(--ease-out-expo)] flex-col gap-4"
        >
          {t.content}
        </div>
      ))}
    </div>
  )
}
