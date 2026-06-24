/**
 * DocumentViewer — Reusable split-pane evidence viewer.
 *
 * Left pane:  Source circular document with inline evidence highlights.
 * Right pane: MAP obligation cards sorted by priority.
 *
 * Clicking a MAP card scrolls the document to its highlighted passage.
 * Clicking a document highlight selects the corresponding MAP card.
 *
 * Priority color scheme:
 *   Critical → red   |   High → orange   |   Medium → blue   |   Low → slate
 *
 * Fully offline — no network calls. Deterministic rendering.
 *
 * Props:
 *   maps     — MAP[] with evidence_start_offset, evidence_end_offset, priority, etc.
 *   circular — { id, title, source, content } | null
 *   loading  — boolean
 *   height   — CSS height string (default 'calc(100vh - 14rem)')
 *   className — optional additional classes for the root element
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  BookOpen, Brain, Quote, Microscope, AlertTriangle,
} from 'lucide-react'

// ── Priority theme tokens ─────────────────────────────────────────────────────

const PRIORITY_CFG = {
  Critical: {
    dot:    'bg-red-500',
    bg:     'bg-red-50/80 dark:bg-red-900/20',
    text:   'text-red-700 dark:text-red-300',
    ring:   'ring-red-400',
    border: 'border-l-red-400',
    badge:  'text-red-600 dark:text-red-400',
  },
  High: {
    dot:    'bg-orange-400',
    bg:     'bg-orange-50/80 dark:bg-orange-900/20',
    text:   'text-orange-700 dark:text-orange-300',
    ring:   'ring-orange-400',
    border: 'border-l-orange-400',
    badge:  'text-orange-600 dark:text-orange-400',
  },
  Medium: {
    dot:    'bg-blue-400',
    bg:     'bg-blue-50/80 dark:bg-blue-900/20',
    text:   'text-blue-700 dark:text-blue-300',
    ring:   'ring-blue-400',
    border: 'border-l-blue-400',
    badge:  'text-blue-600 dark:text-blue-400',
  },
  Low: {
    dot:    'bg-slate-400',
    bg:     'bg-slate-50/80 dark:bg-slate-800/20',
    text:   'text-slate-600 dark:text-slate-400',
    ring:   'ring-slate-300',
    border: 'border-l-slate-300',
    badge:  'text-slate-500 dark:text-slate-400',
  },
}

const PROVENANCE_LABELS = {
  clause_anchored:  'Clause-Anchored',
  keyword_match:    'Keyword Match',
  sentence_jaccard: 'Semantic Match',
}

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }

// ── Document text renderer ────────────────────────────────────────────────────

function DocumentPane({ content, highlights, highlightRefs, onHighlightClick, selectedId }) {
  if (!content) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#8b98aa]">No document content available.</p>
      </div>
    )
  }

  // Sort highlights by start offset, discard invalid entries
  const sorted = [...highlights]
    .filter((h) => h.start != null && h.end != null && h.start >= 0 && h.start < h.end)
    .sort((a, b) => a.start - b.start)

  if (!sorted.length) {
    return (
      <div className="text-[13px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80 whitespace-pre-line font-sans">
        {content}
      </div>
    )
  }

  // Build plain-text + highlight segments, resolving overlaps by advancing cursor
  const segs = []
  let cursor = 0
  for (const h of sorted) {
    const s = Math.max(h.start, cursor)
    const e = Math.min(h.end, content.length)
    if (s > cursor) segs.push({ plain: true, text: content.slice(cursor, s) })
    if (s < e) {
      segs.push({ plain: false, text: content.slice(s, e), meta: h })
      cursor = e
    }
  }
  if (cursor < content.length) segs.push({ plain: true, text: content.slice(cursor) })

  return (
    <div className="text-[13px] leading-relaxed font-sans whitespace-pre-wrap">
      {segs.map((seg, i) => {
        if (seg.plain) {
          return (
            <span key={i} className="text-gray-700 dark:text-[#e8edf5]/75">
              {seg.text}
            </span>
          )
        }

        const cfg      = PRIORITY_CFG[seg.meta.priority] || PRIORITY_CFG.Low
        const isActive = seg.meta.mapId === selectedId

        return (
          <button
            key={i}
            ref={(el) => { if (el) highlightRefs.current[seg.meta.mapId] = el }}
            onClick={() => onHighlightClick(seg.meta.mapId)}
            title={`${seg.meta.priority} priority · ${seg.meta.department} · Click to select MAP`}
            className={[
              'inline rounded px-0.5 cursor-pointer transition-all duration-150',
              isActive
                ? `${cfg.bg} ring-2 ring-offset-0 ${cfg.ring} shadow-sm`
                : `${cfg.bg} hover:ring-1 hover:ring-offset-0 ${cfg.ring}`,
              cfg.text,
            ].join(' ')}
            style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
          >
            {seg.text}
          </button>
        )
      })}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton({ height }) {
  return (
    <div className="flex gap-4 animate-pulse" style={{ height }}>
      <div className="flex-1 rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
        <div className="h-10 border-b border-line bg-paper/40 dark:bg-surface/40" />
        <div className="p-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-4 rounded" style={{ width: `${55 + (i % 4) * 10}%` }} />
          ))}
        </div>
      </div>
      <div className="w-80 flex-shrink-0 rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
        <div className="h-10 border-b border-line bg-paper/40 dark:bg-surface/40" />
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentViewer({
  maps     = [],
  circular = null,
  loading  = false,
  height   = 'calc(100vh - 14rem)',
  className = '',
}) {
  const [selectedId, setSelectedId] = useState(null)
  const mapCardRefs   = useRef({})
  const highlightRefs = useRef({})

  // Sort MAPs by priority so Critical appears first
  const sortedMaps = useMemo(
    () => [...maps].sort((a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3),
    ),
    [maps],
  )

  const hasEvidence = useMemo(
    () => maps.some((m) => m.evidence_start_offset != null),
    [maps],
  )

  const highlights = useMemo(() => {
    if (!hasEvidence) return []
    return maps
      .filter((m) => m.evidence_start_offset != null && m.evidence_end_offset != null)
      .map((m) => ({
        mapId:      m.id,
        start:      m.evidence_start_offset,
        end:        m.evidence_end_offset,
        priority:   m.priority,
        department: m.department,
      }))
  }, [maps, hasEvidence])

  const selectedMap = useMemo(
    () => maps.find((m) => m.id === selectedId) ?? null,
    [maps, selectedId],
  )

  // Clicking a MAP card: select it and scroll the right-pane highlight into view
  const handleMapSelect = useCallback((mapId) => {
    setSelectedId((prev) => {
      const next = prev === mapId ? null : mapId
      if (next) {
        requestAnimationFrame(() => {
          highlightRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      }
      return next
    })
  }, [])

  // Clicking a document highlight: select it and scroll the MAP card into view
  const handleHighlightClick = useCallback((mapId) => {
    setSelectedId((prev) => {
      const next = prev === mapId ? null : mapId
      if (next) {
        requestAnimationFrame(() => {
          mapCardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      }
      return next
    })
  }, [])

  if (loading) return <LoadingSkeleton height={height} />

  return (
    <div className={`flex gap-4 ${className}`} style={{ height }}>

      {/* ── LEFT: Circular document with evidence highlights ─────────────── */}
      <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-line bg-white dark:bg-card overflow-hidden">

        {/* Panel header */}
        <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3 flex-shrink-0">
          <BookOpen size={13} className="text-brass" />
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
            Source Circular Document
          </p>
          {circular && (
            <span className="ml-2 font-mono text-[9px] text-[#8b98aa] truncate">
              {circular.source} — {circular.title}
            </span>
          )}
          {hasEvidence && (
            <span className="ml-auto font-mono text-[9px] text-violet-500 dark:text-violet-400 flex-shrink-0">
              Click highlighted text to select MAP
            </span>
          )}
        </div>

        {/* Scrollable document text */}
        <div className="flex-1 overflow-y-auto p-5">
          <DocumentPane
            content={circular?.content ?? ''}
            highlights={highlights}
            highlightRefs={highlightRefs}
            onHighlightClick={handleHighlightClick}
            selectedId={selectedId}
          />
        </div>

        {/* Priority legend */}
        {hasEvidence && (
          <div className="border-t border-line px-5 py-2 flex-shrink-0 flex items-center gap-5">
            <span className="font-mono text-[9px] text-[#8b98aa]">Legend:</span>
            {Object.entries(PRIORITY_CFG).map(([p, cfg]) => (
              <div key={p} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-6 rounded ${cfg.bg} border border-current ${cfg.badge}`} />
                <span className="font-mono text-[9px] text-[#8b98aa]">{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: MAP obligation cards ──────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col rounded-xl border border-line bg-white dark:bg-card overflow-hidden">

        {/* Panel header */}
        <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3 flex-shrink-0">
          <Brain size={13} className="text-violet-500" />
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
            Extracted MAPs
          </p>
          <span className="ml-auto rounded-full bg-ink/10 dark:bg-surface px-2 py-0.5 font-mono text-[9px] text-[#8b98aa]">
            {maps.length}
          </span>
        </div>

        {/* MAP list */}
        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {sortedMaps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <AlertTriangle size={20} className="text-[#8b98aa]/40" />
              <p className="text-sm text-[#8b98aa]">No MAPs extracted.</p>
            </div>
          ) : (
            sortedMaps.map((m) => {
              const cfg        = PRIORITY_CFG[m.priority] || PRIORITY_CFG.Low
              const isSelected = selectedId === m.id

              return (
                <button
                  key={m.id}
                  ref={(el) => { if (el) mapCardRefs.current[m.id] = el }}
                  onClick={() => handleMapSelect(m.id)}
                  className={[
                    'w-full text-left px-4 py-3.5 transition-colors border-l-2',
                    isSelected
                      ? `${cfg.bg} ${cfg.border}`
                      : 'border-l-transparent hover:bg-paper/60 dark:hover:bg-surface/60',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
                    <div className="min-w-0 flex-1">

                      {/* Action text */}
                      <p className={[
                        'text-[12px] leading-snug line-clamp-2',
                        isSelected
                          ? 'text-ink dark:text-[#e8edf5] font-medium'
                          : 'text-gray-700 dark:text-[#e8edf5]/80',
                      ].join(' ')}>
                        {m.action}
                      </p>

                      {/* Metadata row */}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-[9px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
                          {m.priority}
                        </span>
                        {m.department && (
                          <span className="font-mono text-[9px] text-[#8b98aa]">{m.department}</span>
                        )}
                        {m.source_clause && (
                          <span className="font-mono text-[9px] text-brass truncate">§ {m.source_clause}</span>
                        )}
                      </div>

                      {/* Evidence badge — compact when not selected */}
                      {m.evidence_quote && !isSelected && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <Microscope size={9} className="text-violet-400 flex-shrink-0" />
                          <span className="font-mono text-[9px] text-violet-500 dark:text-violet-400">
                            Evidence located
                          </span>
                          {m.evidence_similarity != null && (
                            <span className="ml-auto font-mono text-[9px] text-[#8b98aa]">
                              {Math.round(m.evidence_similarity * 100)}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Evidence detail — expanded when selected */}
                      {m.evidence_quote && isSelected && (
                        <div className="mt-2.5 rounded-md border border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-900/20 px-2.5 py-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Quote size={9} className="text-violet-500 flex-shrink-0" />
                            <span className="font-mono text-[9px] text-violet-600 dark:text-violet-400">
                              {PROVENANCE_LABELS[m.provenance_method] || 'Evidence'}
                              {m.evidence_similarity != null && (
                                <span className="ml-1 text-[#8b98aa]">
                                  · {Math.round(m.evidence_similarity * 100)}% match
                                </span>
                              )}
                            </span>
                          </div>
                          <blockquote className="border-l-2 border-violet-300 dark:border-violet-700 pl-2">
                            <p className="text-[11px] leading-relaxed text-violet-800 dark:text-violet-200 line-clamp-4 italic">
                              "{m.evidence_quote}"
                            </p>
                          </blockquote>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-line px-4 py-2 flex-shrink-0">
          <p className="font-mono text-[10px] text-[#8b98aa]">
            {hasEvidence
              ? 'Click MAP → jump to evidence · Click highlight → select MAP'
              : 'Click MAP to view obligation details'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
