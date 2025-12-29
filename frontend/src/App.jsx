import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertTriangle, Search, Activity, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import SimilarityHeatmap from './components/SimilarityHeatmap'

const API_BASE = 'http://localhost:8000'

function App() {
  const [files, setFiles] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, done, error

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
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-start">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold gradient-text mb-4"
          >
            Plagiarism Checker RAG
          </motion.h1>
          <p className="text-slate-400 text-lg">
            Batch analysis for student assignments using Local Embeddings & RAG.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={resetProject}
            className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors p-2"
          >
            <Trash2 size={20} />
            <span>Clear All</span>
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Upload Section */}
        <section className="lg:col-span-1">
          <div className="glass-card p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Upload className="text-primary-400" />
              Source Assignments
            </h2>

            <div className="flex-1 flex flex-col">
              <div className="border-dashed border-2 border-slate-700 hover:border-primary-400 transition-colors rounded-xl p-8 text-center cursor-pointer relative mb-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Activity className="w-10 h-10 text-slate-600 mb-4 mx-auto" />
                <p className="text-sm text-slate-400">Drag & Drop student files here</p>
                <p className="text-xs text-slate-600 mt-2">Support: PDF, DOCX, TXT</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700 text-xs">
                      <FileText size={16} className="text-primary-400 shrink-0" />
                      <span className="truncate flex-1">{file.name}</span>
                      {uploadStatus === 'done' && <CheckCircle size={14} className="text-green-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={runBatchCheck}
              disabled={files.length === 0 || isAnalyzing}
              className="mt-6 w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold transition-all shadow-lg shadow-primary-900/20"
            >
              {isAnalyzing ? 'Analyzing Patterns...' : uploadStatus === 'uploading' ? 'Uploading...' : 'Run Class Analysis'}
            </button>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="lg:col-span-2 space-y-8">
          {isAnalyzing ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-2xl font-bold">Processing Class Batch</h3>
                <p className="text-slate-400 mt-2">Extracting text and generating local vector embeddings...</p>
              </div>
            </div>
          ) : results ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Heatmap Card */}
              <div className="glass-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">Similarity Heatmap</h3>
                  <span className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-bold border border-primary-500/30">
                    {results.students.length} Students Scanned
                  </span>
                </div>
                <SimilarityHeatmap data={results.heatmap} />
              </div>

              {/* Top Suspects Card */}
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold mb-4">Top Similarity Alerts</h3>
                <div className="space-y-4">
                  {/* Logic to find highest scores could be added here */}
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="text-orange-500" />
                      <div>
                        <p className="font-bold">Peer Similarity Detected</p>
                        <p className="text-sm text-slate-400">Highlighting students with >50% overlap.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-12 h-64 flex flex-col items-center justify-center text-slate-600 border-dashed border-2 border-slate-800">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg">No analysis results yet.</p>
              <p className="text-sm mt-2">Upload assignments and run a check to see the class landscape.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
