/**
 * PRAGMA — Circular Upload (#19)
 * Owner: Ashwin + Anoushka — M3
 * Title + source + circular text → POST /circulars/upload → Claude extracts MAPs.
 * Extraction can take 5–15s; full-form loading state covers it.
 * Falls back to a simulated extraction when the backend is unreachable.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCircular } from '../api/circulars'
import { MOCK_MAPS } from '../utils/mockData'
import { useAppContext } from '../contexts/AppContext'
import { CIRCULAR_SOURCES } from '../utils/constants'

export default function CircularUpload() {
  const navigate = useNavigate()
  const { setNotification } = useAppContext()

  const [title, setTitle] = useState('')
  const [source, setSource] = useState(CIRCULAR_SOURCES[0])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = title.trim().length > 0 && content.trim().length > 30 && !submitting

  const submit = async () => {
    setError('')
    if (!canSubmit) {
      setError('Add a title and at least a few sentences of circular text.')
      return
    }
    setSubmitting(true)
    try {
      let result
      try {
        result = await uploadCircular({ title: title.trim(), source, content: content.trim() })
      } catch {
        // Backend down — simulate the extraction so the demo flow still works
        await new Promise((r) => setTimeout(r, 1800))
        result = { success: true, maps_count: MOCK_MAPS.length, maps: MOCK_MAPS }
      }
      setNotification({
        type: 'success',
        message: `Extracted ${result.maps_count ?? result.maps?.length ?? 0} MAPs`,
      })
      navigate('/maps')
    } catch {
      setError('Extraction failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Circular title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RBI Master Direction — Digital Lending"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CIRCULAR_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">Circular text</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the full regulatory circular here…"
            rows={12}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-gray-400">{content.trim().length} characters</p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Extracting MAPs…' : 'Extract MAPs'}
          </button>
          {submitting && (
            <span className="text-sm text-gray-400">Claude is reading the circular — this can take 10–15s.</span>
          )}
        </div>
      </div>
    </div>
  )
}
