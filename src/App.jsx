import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, Download, RefreshCw, Moon, Sun, Search } from 'lucide-react'

const PwC_RED = '#D9391E'
const GOLD = '#FDB913'
const CHARCOAL = '#333333'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function Header({ dark, onToggleDark }) {
  return (
    <header className={`w-full relative overflow-hidden ${dark ? 'bg-[linear-gradient(135deg,#6b1a10,#111111)]' : 'bg-[linear-gradient(135deg,#D9391E,#333333)]'} text-white` }>
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold font-[Poppins] drop-shadow-sm text-center sm:text-left">ATC Smart Pro</h1>
            <p className="mt-3 text-white/90 font-light max-w-2xl text-center sm:text-left">Intelligent SAP ATC Analyzer for S/4HANA Migration Estimation</p>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Toggle dark mode" onClick={onToggleDark} className="inline-flex items-center justify-center rounded-full p-2 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60" >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <img src="https://images.unsplash.com/photo-1630349713703-08b0f938487c?ixid=M3w3OTkxMTl8MHwxfHNlYXJjaHwxfHxQd0MlMjBsb2dvfGVufDB8MHx8fDE3NjI3OTc2OTR8MA&ixlib=rb-4.1.0&w=1600&auto=format&fit=crop&q=80" alt="PwC logo" className="h-10 w-auto" />
          </div>
        </div>
      </div>
    </header>
  )
}

function UploadPanel({ onProcess, loadingStage, setFiles, files, dark }) {
  const inputRef = useRef(null)

  const onDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files || [])
    setFiles(prev => [...prev, ...dropped].slice(0, 10))
  }

  const onBrowse = (e) => {
    setFiles(Array.from(e.target.files || []))
  }

  return (
    <section className="max-w-5xl mx-auto px-6 -mt-10">
      <div className={`rounded-xl p-6 sm:p-8 shadow-xl ${dark ? 'bg-neutral-900 text-neutral-100' : 'bg-white text-neutral-800'}`}>
        <h2 className="text-2xl font-semibold font-[Poppins]">Upload ATC Reports</h2>
        <p className="text-sm mt-1 opacity-80">Upload one or more .xlsx or .csv ATC result files to begin classification.</p>

        <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="mt-6 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center w-full" style={{ borderColor: GOLD }}>
          <Upload className="mb-3" color={GOLD} aria-label="Upload icon" />
          <p className="font-medium">Drag and drop files here</p>
          <p className="text-xs opacity-70">Multiple files supported. Max file size: 20 MB.</p>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => inputRef.current?.click()} className="px-4 py-2 rounded-md" style={{ backgroundColor: GOLD, color: CHARCOAL }}>Browse</button>
            <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.csv" className="hidden" onChange={onBrowse} />
          </div>
          {files && files.length > 0 && (
            <p className="mt-4 text-sm opacity-80">Selected: {files.map(f => f.name).join(', ')}</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <button onClick={onProcess} disabled={loadingStage !== null || !files?.length} className={`text-white font-semibold px-5 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${loadingStage !== null || !files?.length ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ backgroundColor: PwC_RED }} aria-label="Start Classification">
            Start Classification
          </button>
          <ProgressStages stage={loadingStage} dark={dark} />
        </div>
      </div>
    </section>
  )
}

function ProgressStages({ stage, dark }) {
  const stages = [
    'Reading Files',
    'Analyzing Data',
    'Categorizing Findings',
    'Generating Report'
  ]
  return (
    <div className="flex-1 min-w-[240px]">
      <div className={`w-full h-2 rounded-full overflow-hidden ${dark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: stage === null ? '0%' : `${((stage + 1) / stages.length) * 100}%`,
          background: 'linear-gradient(90deg, #D9391E, #FDB913)'
        }} />
      </div>
      <div className="mt-2 flex justify-between text-xs opacity-80">
        {stages.map((s, i) => (
          <span key={s} className={`${stage !== null && i <= stage ? 'font-semibold' : ''}`}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function Badge({ color, children }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: color + '22', color }}>
      {children}
    </span>
  )
}

function Results({ data, onExport, onClear, dark }) {
  const [category, setCategory] = useState('All')
  const [priority, setPriority] = useState('All')
  const [confidence, setConfidence] = useState('All')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return data.records.filter(r => {
      const catOk = category === 'All' || r.Category === category
      const prioOk = priority === 'All' || String(r.Priority).toLowerCase() === String(priority).toLowerCase()
      const confOk = confidence === 'All' || (Number(r.Confidence) >= Number(confidence))
      const text = `${r['Check Title']} ${r['Check Message']} ${r['Object Name']} ${r['Object Type']} ${r.Package}`.toLowerCase()
      const qOk = !q || text.includes(q)
      return catOk && prioOk && confOk && qOk
    })
  }, [data, category, priority, confidence, query])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [category, priority, confidence, query, pageSize])

  const catColor = (c) => c === 'Syntax' ? '#E03C31' : c === 'Mandatory' ? '#F76902' : '#00A86B'

  return (
    <section className="max-w-7xl mx-auto px-6 mt-12">
      <h3 className="text-2xl font-semibold font-[Poppins]">Classification Results</h3>
      <p className="text-sm mt-1 opacity-80">Your ATC findings have been categorized by impact and confidence.</p>

      <div className={`mt-4 rounded-xl p-4 sm:p-5 shadow-lg ${dark ? 'bg-neutral-900 text-neutral-100' : 'bg-white'}`}>
        <div className="flex flex-wrap gap-3 items-center">
          <select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded-md border text-sm">
            {['All','Mandatory','Optional','Syntax'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select aria-label="Filter by priority" value={priority} onChange={e => setPriority(e.target.value)} className="px-3 py-2 rounded-md border text-sm">
            {['All','1','2','3','4','5','Very High','High','Medium','Low','Very Low'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select aria-label="Filter by minimum confidence" value={confidence} onChange={e => setConfidence(e.target.value)} className="px-3 py-2 rounded-md border text-sm">
            {['All',50,60,70,80,90].map(o => <option key={o} value={o}>{o === 'All' ? 'All' : `≥ ${o}%`}</option>)}
          </select>
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search size={16} />
            <input aria-label="Search results" placeholder="Filter results by keyword…" value={query} onChange={e => setQuery(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className={`${dark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                {['Priority','Check Title','Check Message','Object Name','Object Type','Package','Category','Confidence'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold border-b border-neutral-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((r, i) => (
                <tr key={i} className={`hover:${dark ? 'bg-neutral-800/60' : 'bg-neutral-50'}`}>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r.Priority}</td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r['Check Title']}</td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r['Check Message']}</td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r['Object Name']}</td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r['Object Type']}</td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r.Package}</td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100"><Badge color={catColor(r.Category)}>{r.Category}</Badge></td>
                  <td className="px-3 py-2 text-sm border-b border-neutral-100">{r.Confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span>Rows per page:</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-2 py-1 rounded-md border">
              {[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="opacity-70">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md border">Prev</button>
            <span className="text-sm">{page}/{pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 rounded-md border">Next</button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={onExport} className="inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-md" style={{ backgroundColor: GOLD, color: CHARCOAL }}>
            <Download size={16} /> Download Categorized Excel
          </button>
          <button onClick={onClear} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-200">
            <RefreshCw size={16} /> Clear Results
          </button>
          <p className="text-xs opacity-80">Includes category summary and confidence breakdown.</p>
        </div>
      </div>

      <Analytics data={data} dark={dark} />
    </section>
  )
}

function Analytics({ data, dark }) {
  if (!data || !data.records?.length) return null
  const total = data.total
  const cats = ['Mandatory','Optional','Syntax']
  const counts = cats.map(c => data.by_category?.[c] || 0)
  const max = Math.max(1, ...counts)
  const avg = data.avg_confidence || 0
  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={`rounded-xl p-4 shadow ${dark ? 'bg-neutral-900' : 'bg-white'}`}>
        <p className="text-sm opacity-70">Total Findings</p>
        <p className="text-3xl font-bold">{total}</p>
      </div>
      <div className={`rounded-xl p-4 shadow ${dark ? 'bg-neutral-900' : 'bg-white'}`}>
        <p className="text-sm opacity-70">Category Breakdown</p>
        <div className="mt-3 flex items-end gap-3 h-24">
          {counts.map((c, i) => (
            <div key={i} className="flex-1">
              <div className="w-full rounded-t" style={{ height: `${(c / max) * 100}%`, background: i===0? '#F76902' : i===1? '#00A86B' : '#E03C31' }} />
              <p className="text-xs mt-1 text-center">{cats[i]}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={`rounded-xl p-4 shadow ${dark ? 'bg-neutral-900' : 'bg-white'}`}>
        <p className="text-sm opacity-70">Average Confidence</p>
        <p className="text-3xl font-bold">{avg}%</p>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-16">
      <div className="w-full bg-[#F5F5F5] text-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-6 text-sm">
          <p>©️ 2025 PwC – Internal Use Only</p>
          <p className="opacity-80">Results generated based on uploaded ATC findings and PwC classification logic.</p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [dark, setDark] = useState(false)
  const [files, setFiles] = useState([])
  const [loadingStage, setLoadingStage] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    document.body.className = dark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
  }, [dark])

  const processFiles = async () => {
    if (!files?.length) return
    try {
      setLoadingStage(0)
      const form = new FormData()
      files.forEach(f => form.append('files', f))

      setLoadingStage(1)
      const res = await fetch(`${BACKEND_URL}/api/process`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Processing failed')
      setLoadingStage(2)
      const data = await res.json()
      setLoadingStage(3)
      setResult(data)
      setLoadingStage(null)
    } catch (e) {
      console.error(e)
      setLoadingStage(null)
      alert('Failed to process files. Please ensure files are valid .xlsx or .csv ATC exports.')
    }
  }

  const exportExcel = async () => {
    if (!result?.records?.length) return
    const res = await fetch(`${BACKEND_URL}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: result.records })
    })
    if (!res.ok) return alert('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ATC_Smart_Pro_Categorized.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearResults = () => {
    setResult(null)
    setFiles([])
  }

  return (
    <div className="min-h-screen">
      <Header dark={dark} onToggleDark={() => setDark(d => !d)} />
      <main>
        <UploadPanel dark={dark} onProcess={processFiles} loadingStage={loadingStage} setFiles={setFiles} files={files} />
        {result && <Results data={result} onExport={exportExcel} onClear={clearResults} dark={dark} />}
      </main>
      <Footer />
    </div>
  )
}
