import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Newspaper, 
  FileText, 
  Upload, 
  Search, 
  BarChart3, 
  Globe, 
  ChevronRight, 
  Download,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { NewsItem, MIReport, FileMetadata, AppState } from './types';
import Markdown from 'react-markdown';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'files' | 'reports'>('dashboard');
  const [data, setData] = useState<AppState>({ news: [], reports: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportForm, setReportForm] = useState({ country: 'Poland', topic: 'K239 Chunmoo Procurement' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      const news = await res.json();
      setData(prev => ({ ...prev, news }));
    } catch (error) {
      console.error("Failed to refresh news", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const newFile = await res.json();
      setData(prev => ({ ...prev, files: [newFile, ...prev.files] }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm)
      });
      const newReport = await res.json();
      setData(prev => ({ ...prev, reports: [newReport, ...prev.reports] }));
      setActiveTab('reports');
    } catch (error) {
      console.error("Report generation failed", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {activeTab === id && (
        <motion.div layoutId="sidebar-indicator" className="ml-auto">
          <ChevronRight size={16} />
        </motion.div>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] font-sans text-slate-200 overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">P</div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">
            PGM <span className="font-light opacity-60 italic">Global Insight Hub</span>
          </h1>
        </div>
        <div className="flex space-x-6 text-sm font-medium">
          {['dashboard', 'news', 'files', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`capitalize transition-all ${
                activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-xs text-slate-400">System: {loading ? 'Syncing' : 'Live'}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold">
            JD
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 p-6 flex flex-col space-y-8 shrink-0">
          <section>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Monitoring Scope</p>
            <div className="space-y-2">
              {['Poland', 'Saudi Arabia', 'Romania'].map((c) => (
                <div 
                  key={c}
                  className={`flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${
                    reportForm.country === c 
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                      : 'hover:bg-slate-800 border-transparent text-slate-400'
                  }`}
                  onClick={() => setReportForm(prev => ({ ...prev, country: c }))}
                >
                  <span className="text-sm">{c}</span>
                  <span className={`text-[10px] font-mono ${reportForm.country === c ? 'opacity-100' : 'opacity-40'}`}>
                    {reportForm.country === c ? 'Active' : 'Idle'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Quick Actions</p>
            <div className="space-y-3">
              <label className="block w-full text-left text-xs bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 cursor-pointer transition-colors">
                Upload Defense PDF
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              </label>
              <button 
                onClick={refreshNews}
                className="w-full text-left text-xs bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 transition-colors"
              >
                Sync News Monitor
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className="w-full text-left text-xs bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 transition-colors"
              >
                Generate Briefing Report
              </button>
            </div>
          </section>

          <div className="mt-auto p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <p className="text-xs text-blue-400 font-semibold mb-1 italic">AI Suggestion</p>
            <p className="text-[11px] leading-relaxed text-slate-400 italic">
              "K239 Poland procurement window closing Q4. Recommend immediate briefing update."
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-brand-bg">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col h-full space-y-6"
                >
                  <div className="grid grid-cols-3 gap-4 shrink-0">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">News Database</p>
                      <h2 className="text-2xl font-light text-white mt-1">{data.news.length} <span className="text-xs text-emerald-400 font-mono italic">Live Feed</span></h2>
                      <p className="text-[10px] text-slate-600 mt-2">Active Intelligence: {reportForm.country}</p>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Market Reports</p>
                      <h2 className="text-2xl font-light text-white mt-1">{data.files.length} <span className="text-xs text-orange-400 font-mono italic">Analyzed</span></h2>
                      <p className="text-[10px] text-slate-600 mt-2">Source: Jane's, SIPRI, Local MoD</p>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Strategic Briefings</p>
                      <h2 className="text-2xl font-light text-white mt-1">{data.reports.length} <span className="text-xs text-blue-400 font-mono italic">K-Tech Hub</span></h2>
                      <p className="text-[10px] text-slate-600 mt-2">Proprietary Strategy Assets</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-5 gap-6 min-h-0">
                    <div className="col-span-3 flex flex-col space-y-4 min-h-0">
                      <div className="flex items-center justify-between shrink-0">
                        <h3 className="text-sm font-bold uppercase tracking-tight text-white flex items-center gap-2">
                          <Newspaper size={14} className="text-blue-500" />
                          AI Intelligence Feed
                        </h3>
                        <span className="text-xs text-slate-500">Latest Intelligence Update</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {data.news.length > 0 ? data.news.slice(0, 10).map((item) => (
                          <div key={item.id} className="bg-slate-800/40 border border-slate-800 p-4 rounded-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                            <div className="absolute left-0 top-0 w-1 h-full bg-blue-600"></div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 uppercase tracking-tighter">NEWS MONITORING: {item.country}</span>
                              <span className="text-[10px] font-mono text-slate-500">{format(new Date(item.publishedAt), 'HH:mm')}</span>
                            </div>
                            <p className="text-sm text-slate-200 font-medium mb-1 underline decoration-blue-500/30 underline-offset-4 group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {item.summary}
                            </p>
                          </div>
                        )) : (
                          <div className="text-center py-20 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                            <p className="text-slate-500 text-sm">No live feed data available. Trigger news sync to begin.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 p-5 min-h-0 shadow-2xl">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-white mb-4 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                        Research Assistant
                      </h3>
                      <div className="flex-1 flex flex-col space-y-4 overflow-y-auto mb-4 scrollbar-hide">
                        <div className="self-start bg-slate-800 text-slate-300 text-[11px] p-3 rounded-2xl rounded-tl-none max-w-[95%] border border-slate-700 leading-relaxed shadow-lg">
                          Greetings. I am your MI Assistant. I can generate briefings based on current market data, analyze uploaded PDF reports, or compare defense budget trends.
                          <br/><br/>
                          Currently monitoring: <span className="text-blue-400 font-bold">{reportForm.country}</span>.
                        </div>
                        
                        {generatingReport && (
                          <div className="self-start bg-slate-800 text-slate-300 text-[11px] p-3 rounded-2xl rounded-tl-none max-w-[95%] border border-slate-700 leading-relaxed shadow-lg animate-pulse">
                            Generating comprehensive market briefing for {reportForm.country}... This takes approximately 15-20 seconds.
                          </div>
                        )}
                        
                        {data.reports.slice(0, 1).map((r) => (
                          <div key={r.id} className="self-start bg-slate-800 text-slate-300 text-[11px] p-3 rounded-2xl rounded-tl-none max-w-[95%] border border-slate-700 leading-relaxed shadow-lg">
                            <span className="text-blue-400 font-bold uppercase">Latest Briefing: {r.title}</span>
                            <div className="mt-2 text-[10px] opacity-80 line-clamp-4">
                              {r.sections[0].content}
                            </div>
                            <button 
                              onClick={() => setActiveTab('reports')}
                              className="mt-3 text-blue-400 hover:underline font-bold uppercase tracking-tighter"
                            >
                              Open Full Report
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-auto space-y-3">
                        <div className="flex flex-col gap-2 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Target Topic</label>
                          <input 
                            type="text"
                            value={reportForm.topic}
                            onChange={(e) => setReportForm({ ...reportForm, topic: e.target.value })}
                            className="bg-transparent border-none text-xs w-full focus:ring-0 placeholder:text-slate-700 text-slate-300"
                            placeholder="Specify analysis topic..."
                          />
                        </div>
                        <button 
                          onClick={generateReport}
                          disabled={generatingReport}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 disabled:opacity-50"
                        >
                          {generatingReport ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
                          {generatingReport ? 'Analyzing...' : 'Generate New Briefing'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'news' && (
                <motion.div
                  key="news"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10"
                >
                  {data.news.map((item) => (
                    <article key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col shadow-xl">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded uppercase tracking-widest border border-slate-700">
                            {item.country}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{format(new Date(item.publishedAt), 'yyyy-MM-dd')}</span>
                        </div>
                        <h3 className="text-base font-bold mb-3 leading-tight group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                      <div className="px-5 py-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-600 italic">Source: {item.source}</span>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase"
                        >
                          View Original <ExternalLink size={10} />
                        </a>
                      </div>
                    </article>
                  ))}
                </motion.div>
              )}

              {activeTab === 'files' && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 pb-10"
                >
                  {data.files.map((file) => (
                    <div key={file.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-5 group hover:border-slate-700 transition-all shadow-xl">
                      <div className="p-3 bg-slate-800 rounded-lg h-fit group-hover:bg-blue-600/10 transition-colors">
                        <FileText size={24} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold group-hover:text-white transition-colors">{file.name}</h3>
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{format(new Date(file.uploadDate), 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-600 font-bold mb-4">
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="uppercase">{file.type.split('/')[1] || file.type}</span>
                        </div>
                        {file.summary && (
                          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-0.5 h-full bg-blue-600/30"></div>
                            <h4 className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
                              AI Insights Extraction
                            </h4>
                            <div className="prose prose-invert prose-sm max-w-none text-slate-400 text-[11px] leading-relaxed">
                              <Markdown>{file.summary}</Markdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.files.length === 0 && (
                    <div className="text-center py-24 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl">
                      <Upload size={40} className="mx-auto text-slate-800 mb-4" />
                      <h3 className="text-lg font-bold text-slate-400">No Intelligence Repositories Detected</h3>
                      <p className="text-slate-600 text-sm mt-1 max-w-xs mx-auto italic">"Upload specialized defense reports to populate the knowledge base."</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12 pb-20"
                >
                  {data.reports.map((report) => (
                    <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]">
                      <div className="w-full md:w-72 bg-slate-950 p-8 border-r border-slate-800 flex flex-col shrink-0">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase tracking-widest mb-6 inline-block w-fit">
                          {report.country} MI REPORT
                        </span>
                        <h3 className="text-2xl font-black tracking-tighter leading-none mb-10">{report.title}</h3>
                        
                        <div className="mt-auto space-y-4">
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Generated At</p>
                            <p className="text-sm font-mono text-slate-400">{format(new Date(report.createdAt), 'yyyy.MM.dd HH:mm')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Security Status</p>
                            <p className="text-sm font-mono text-emerald-500">PROPRIETARY</p>
                          </div>
                          <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors uppercase tracking-widest border border-slate-700">
                            <Download size={14} /> Export Asset
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                        {report.sections.map((section, idx) => (
                          <section key={idx} className="relative pl-12 group">
                            <div className="absolute left-0 top-1 w-8 h-8 bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center rounded-lg text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              0{idx + 1}
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-white mb-4 border-b border-slate-800 pb-2">
                              {section.title}
                            </h4>
                            <div className="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed text-[13px]">
                              <Markdown>{section.content}</Markdown>
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  ))}
                  {data.reports.length === 0 && (
                    <div className="text-center py-24">
                      <Globe size={40} className="mx-auto text-slate-800 mb-4" />
                      <h3 className="text-lg font-bold text-slate-400">Zero Briefings Generated</h3>
                      <p className="text-slate-600 text-sm mt-1">Select a topic in the Insight Generator to produce an AI briefing.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <footer className="h-8 bg-slate-950 border-t border-slate-900 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter flex items-center gap-1">
                <AlertCircle size={10} /> Data Citation Enforced
              </span>
              <span className="text-[10px] text-slate-600">|</span>
              <span className="text-[10px] text-slate-600 italic">Proprietary Strategy Asset</span>
            </div>
            <div className="text-[10px] font-mono text-slate-700 uppercase">PGM Division • MI Intelligence Center © 2024</div>
          </footer>
        </main>
      </div>
    </div>
  );

}
