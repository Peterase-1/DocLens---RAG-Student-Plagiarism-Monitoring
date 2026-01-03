import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle, Search, Activity, Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import SimilarityHeatmap from './components/SimilarityHeatmap'

const API_BASE = 'http://localhost:8000'

function App() {
  const [files, setFiles] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, done, error
  const [comparisonResult, setComparisonResult] = useState(null)
  const [isComparing, setIsComparing] = useState(false)

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files)
    setFiles(uploadedFiles)
    setUploadStatus('idle')
    setResults(null)
  }

  const runBatchCheck = async () => {
    if (files.length === 0) return

    setUploadStatus('uploading')
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      // 1. Upload files
      await axios.post(`${API_BASE}/upload`, formData)
      setUploadStatus('done')

      // 2. Run analysis
      setIsAnalyzing(true)
      const response = await axios.get(`${API_BASE}/analyze`)
      setResults(response.data)
    } catch (error) {
      console.error("Analysis failed", error)
      setUploadStatus('error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetProject = () => {
    setFiles([])
    setResults(null)
    setUploadStatus('idle')
    setComparisonResult(null)
  }

  const handleCompare = async (rIdx, cIdx) => {
    if (!results || !results.students) return
    if (rIdx === cIdx) return

    const file1 = results.students[rIdx]
    const file2 = results.students[cIdx]

    setIsComparing(true)
    setComparisonResult(null)

    try {
      const response = await axios.post(`${API_BASE}/compare`, null, {
        params: { file1, file2 }
      })
      setComparisonResult({
        file1,
        file2,
        analysis: response.data.analysis
      })
    } catch (error) {
      console.error("Comparison failed", error)
      alert("Failed to compare files.")
    } finally {
      setIsComparing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-start">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold gradient-text mb-4"
          >
            Plagiarism Checker RAG
          </motion.h1>
          <p className="text-zinc-400 text-lg">
            Batch analysis for student assignments using Local Embeddings & RAG.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={resetProject}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors p-2"
          >
            <Trash2 size={20} />
            <span>Clear All</span>
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Upload Section */}
        <section className="lg:col-span-1">
          <div className="glass-card p-6 h-full flex flex-col border-zinc-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Upload className="text-white" />
              Source Assignments
            </h2>

            <div className="flex-1 flex flex-col">
              <div className="border-dashed border-2 border-zinc-800 hover:border-white transition-colors rounded-xl p-8 text-center cursor-pointer relative mb-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Activity className="w-10 h-10 text-zinc-600 mb-4 mx-auto" />
                <p className="text-sm text-zinc-400">Drag & Drop student files here</p>
                <p className="text-xs text-zinc-600 mt-2">Support: PDF, DOCX, TXT</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-900/40 rounded-lg border border-zinc-800 text-xs">
                      <FileText size={16} className="text-white shrink-0" />
                      <span className="truncate flex-1 text-zinc-300">{file.name}</span>
                      {uploadStatus === 'done' && <CheckCircle size={14} className="text-white" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={runBatchCheck}
              disabled={files.length === 0 || isAnalyzing}
              className="mt-6 w-full py-4 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 font-bold transition-all"
            >
              {isAnalyzing ? 'Analyzing Patterns...' : uploadStatus === 'uploading' ? 'Uploading...' : 'Run Class Analysis'}
            </button>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="lg:col-span-2 space-y-8">
          {isAnalyzing ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6 border-zinc-800">
              <div className="w-16 h-16 border-4 border-zinc-600 border-t-white rounded-full animate-spin"></div>
              <div>
                <h3 className="text-2xl font-bold">Processing Class Batch</h3>
                <p className="text-zinc-400 mt-2">Extracting text and generating local vector embeddings...</p>
              </div>
            </div>
          ) : results ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Heatmap Card */}
              <div className="glass-card p-8 border-zinc-800">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">Similarity Heatmap</h3>
                  <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                    {results.students.length} Students Scanned
                  </span>
                </div>
                <SimilarityHeatmap
                  data={results.heatmap}
                  onCellClick={handleCompare}
                />
              </div>

              {/* Top Suspects Card */}
              <div className="glass-card p-8 border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Top Similarity Alerts</h3>
                <div className="space-y-4">
                  {/* Logic to find highest scores could be added here */}
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="text-white" />
                      <div>
                        <p className="font-bold">Peer Similarity Detected</p>
                        <p className="text-sm text-zinc-400">Highlighting students with &gt;50% overlap.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-12 h-64 flex flex-col items-center justify-center text-zinc-600 border-dashed border-2 border-zinc-800">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg">No analysis results yet.</p>
              <p className="text-sm mt-2">Upload assignments and run a check to see the class landscape.</p>
            </div>
          )}
        </section>
      </main>

      {/* Comparison Modal */}
      {
        (isComparing || comparisonResult) && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-8 z-50 backdrop-blur-sm">
            <div className="bg-black border border-zinc-800 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl">
              <button
                onClick={() => { setIsComparing(false); setComparisonResult(null); }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6 gradient-text">AI Comparison Analysis</h2>

              {isComparing ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-12 h-12 border-4 border-zinc-600 border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-400">Consulting LLM expert...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-white" /> {comparisonResult.file1}
                    </div>
                    <span>vs</span>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-white" /> {comparisonResult.file2}
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                      {comparisonResult.analysis}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  )
}

export default App
