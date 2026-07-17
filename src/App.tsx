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
    <div className="flex flex-col h-screen bg-white font-sans text-hanwha-gray-dark overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-hanwha-gray-dark flex items-center gap-2">
              HANWHA <span className="text-hanwha-orange">AEROSPACE</span>
            </h1>
            <span className="text-[10px] font-bold text-hanwha-gray-mid tracking-widest uppercase opacity-60">Global Insight Hub</span>
          </div>
        </div>
        <div className="flex space-x-8 text-sm font-bold">
          {['dashboard', 'news', 'files', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`capitalize transition-all pb-2 border-b-2 ${
                activeTab === tab 
                  ? 'text-hanwha-orange border-hanwha-orange' 
                  : 'text-hanwha-gray-mid border-transparent hover:text-hanwha-orange'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[11px] font-bold text-hanwha-gray-mid uppercase">MI-CORE: {loading ? 'SYNCING' : 'ACTIVE'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-hanwha-gray-dark text-white flex items-center justify-center text-xs font-black shadow-lg">
            MI
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-gray-50 border-r border-gray-200 p-8 flex flex-col space-y-10 shrink-0">
          <section>
            <p className="text-[11px] uppercase tracking-[0.2em] text-hanwha-gray-mid font-black mb-6">Monitoring Scope</p>
            <div className="space-y-3">
              {['Poland', 'Saudi Arabia', 'Romania'].map((c) => (
                <div 
                  key={c}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                    reportForm.country === c 
                      ? 'bg-white border-hanwha-orange shadow-md text-hanwha-orange' 
                      : 'bg-white border-gray-100 hover:border-hanwha-orange/30 text-hanwha-gray-mid'
                  }`}
                  onClick={() => setReportForm(prev => ({ ...prev, country: c }))}
                >
                  <span className="text-sm font-bold">{c}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${reportForm.country === c ? 'bg-hanwha-orange animate-pulse' : 'bg-gray-300'}`}></div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.2em] text-hanwha-gray-mid font-black mb-6">Intelligence Ops</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 w-full text-left text-xs bg-hanwha-gray-dark text-white hover:bg-hanwha-orange p-4 rounded-xl shadow-lg transition-all cursor-pointer font-bold uppercase tracking-wider">
                <Upload size={16} />
                Upload PDF Report
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              </label>
              <button 
                onClick={refreshNews}
                className="flex items-center gap-3 w-full text-left text-xs bg-white text-hanwha-gray-dark hover:bg-gray-100 p-4 rounded-xl border border-gray-200 transition-all font-bold uppercase tracking-wider"
              >
                <RefreshCw size={16} />
                Sync Monitor
              </button>
            </div>
          </section>

          <div className="mt-auto p-5 bg-hanwha-orange/5 border border-hanwha-orange/20 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-hanwha-orange"></div>
            <p className="text-[11px] text-hanwha-orange font-black mb-2 flex items-center gap-2">
              <AlertCircle size={12} />
              STRATEGIC ALERT
            </p>
            <p className="text-[11px] leading-relaxed text-hanwha-gray-mid font-medium italic">
              "Competitive movement detected in Romania MLRS tender. Update market briefing."
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full space-y-10"
                >
                  <div className="grid grid-cols-3 gap-6 shrink-0">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-hanwha-orange/5 rounded-full -mr-12 -mt-12"></div>
                      <p className="text-[11px] text-hanwha-gray-mid font-black uppercase tracking-widest mb-4">MI Live Feed</p>
                      <h2 className="text-4xl font-black text-hanwha-gray-dark">{data.news.length}</h2>
                      <p className="text-[11px] text-hanwha-orange font-bold mt-2 uppercase">Verified Intelligence</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-hanwha-orange/5 rounded-full -mr-12 -mt-12"></div>
                      <p className="text-[11px] text-hanwha-gray-mid font-black uppercase tracking-widest mb-4">Strategic Assets</p>
                      <h2 className="text-4xl font-black text-hanwha-gray-dark">{data.files.length}</h2>
                      <p className="text-[11px] text-hanwha-orange font-bold mt-2 uppercase">Market Reports</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-hanwha-orange/5 rounded-full -mr-12 -mt-12"></div>
                      <p className="text-[11px] text-hanwha-gray-mid font-black uppercase tracking-widest mb-4">AI Briefings</p>
                      <h2 className="text-4xl font-black text-hanwha-gray-dark">{data.reports.length}</h2>
                      <p className="text-[11px] text-hanwha-orange font-bold mt-2 uppercase">Decision Support</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-5 gap-10 min-h-0">
                    <div className="col-span-3 flex flex-col space-y-6 min-h-0">
                      <div className="flex items-center justify-between shrink-0 border-b border-gray-100 pb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-hanwha-gray-dark flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-hanwha-orange rounded-full"></div>
                          Intelligence Stream
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time Global Monitoring</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-hide">
                        {data.news.length > 0 ? data.news.slice(0, 10).map((item) => (
                          <div key={item.id} className="bg-gray-50 border border-gray-100 p-6 rounded-2xl relative overflow-hidden group hover:border-hanwha-orange hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-3 py-1 bg-hanwha-orange text-white text-[10px] font-black rounded uppercase tracking-widest">
                                {item.country}
                              </span>
                              <span className="text-[10px] font-black text-gray-400">{format(new Date(item.publishedAt), 'HH:mm')} • {item.source}</span>
                            </div>
                            <h4 className="text-lg font-black text-hanwha-gray-dark mb-2 group-hover:text-hanwha-orange transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs text-hanwha-gray-mid leading-relaxed font-medium">
                              {item.summary}
                            </p>
                          </div>
                        )) : (
                          <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Newspaper size={32} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Awaiting Data Synchronization</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col bg-hanwha-gray-dark rounded-3xl p-8 min-h-0 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-hanwha-orange/10 rounded-full -mr-16 -mt-16"></div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                        <BarChart3 size={18} className="text-hanwha-orange" />
                        AI Analysis Hub
                      </h3>
                      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto mb-8 scrollbar-hide">
                        <div className="bg-white/5 border border-white/10 text-white/80 text-[11px] p-5 rounded-2xl rounded-tl-none leading-relaxed font-medium">
                          Strategic Analysis System initialized. Ready to process market intelligence for <span className="text-hanwha-orange font-bold uppercase">{reportForm.country}</span>.
                        </div>
                        
                        {generatingReport && (
                          <div className="bg-white/5 border border-white/10 text-white/80 text-[11px] p-5 rounded-2xl rounded-tl-none leading-relaxed font-medium animate-pulse flex items-center gap-3">
                            <RefreshCw size={14} className="animate-spin text-hanwha-orange" />
                            <span>Aggregating cross-border intelligence assets...</span>
                          </div>
                        )}
                        
                        {data.reports.slice(0, 1).map((r) => (
                          <div key={r.id} className="bg-white/5 border border-white/10 text-white/80 text-[11px] p-5 rounded-2xl rounded-tl-none leading-relaxed font-medium">
                            <span className="text-hanwha-orange font-black uppercase block mb-2 tracking-widest">Latest Insight: {r.title}</span>
                            <div className="opacity-70 line-clamp-3 mb-4">
                              {r.sections[0].content}
                            </div>
                            <button 
                              onClick={() => setActiveTab('reports')}
                              className="text-white font-black uppercase tracking-[0.2em] text-[9px] border-b border-hanwha-orange pb-1 hover:text-hanwha-orange transition-colors"
                            >
                              Expand Intelligence
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-auto space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Analysis Focus</label>
                          <input 
                            type="text"
                            value={reportForm.topic}
                            onChange={(e) => setReportForm({ ...reportForm, topic: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs w-full focus:ring-1 focus:ring-hanwha-orange text-white outline-none"
                            placeholder="Specify strategic topic..."
                          />
                        </div>
                        <button 
                          onClick={generateReport}
                          disabled={generatingReport}
                          className="w-full bg-hanwha-orange hover:bg-white hover:text-hanwha-gray-dark text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-xl"
                        >
                          {generatingReport ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
                          {generatingReport ? 'Synthesizing...' : 'Generate Briefing'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'news' && (
                <motion.div
                  key="news"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20"
                >
                  {data.news.map((item) => (
                    <article key={item.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden group hover:border-hanwha-orange hover:shadow-2xl transition-all duration-500 flex flex-col">
                      <div className="p-8 flex-1">
                        <div className="flex justify-between items-center mb-6">
                          <span className="px-3 py-1 bg-gray-100 text-hanwha-gray-dark text-[10px] font-black rounded uppercase tracking-widest">
                            {item.country}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(item.publishedAt), 'yyyy.MM.dd')}</span>
                        </div>
                        <h3 className="text-xl font-black mb-4 leading-tight group-hover:text-hanwha-orange transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-hanwha-gray-mid text-xs mb-8 leading-relaxed font-medium">
                          {item.summary}
                        </p>
                      </div>
                      <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ref: {item.source}</span>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] font-black text-hanwha-orange hover:underline uppercase tracking-widest"
                        >
                          Access Source <ExternalLink size={12} />
                        </a>
                      </div>
                    </article>
                  ))}
                </motion.div>
              )}

              {activeTab === 'files' && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-20"
                >
                  {data.files.map((file) => (
                    <div key={file.id} className="bg-white border border-gray-100 rounded-3xl p-8 flex gap-8 group hover:border-hanwha-orange hover:shadow-2xl transition-all duration-500">
                      <div className="p-5 bg-gray-50 rounded-2xl h-fit group-hover:bg-hanwha-orange/5 transition-colors">
                        <FileText size={32} className="text-hanwha-orange" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-2xl font-black text-hanwha-gray-dark group-hover:text-hanwha-orange transition-colors">{file.name}</h3>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(file.uploadDate), 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8">
                          <span className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{file.type.split('/')[1] || file.type} Asset</span>
                        </div>
                        {file.summary && (
                          <div className="p-8 bg-gray-50 border border-gray-100 rounded-3xl relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-1.5 h-full bg-hanwha-orange/30"></div>
                            <h4 className="text-[10px] font-black text-hanwha-orange uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                              <div className="w-2 h-2 bg-hanwha-orange rounded-full"></div>
                              Automated Intelligence Extraction
                            </h4>
                            <div className="prose prose-slate prose-sm max-w-none text-hanwha-gray-mid text-[12px] leading-relaxed font-medium">
                              <Markdown>{file.summary}</Markdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.files.length === 0 && (
                    <div className="text-center py-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem]">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Upload size={32} className="text-gray-300" />
                      </div>
                      <h3 className="text-xl font-black text-hanwha-gray-dark uppercase tracking-widest">No Intelligence Assets Found</h3>
                      <p className="text-gray-400 text-sm mt-2 font-medium">Upload technical reports or market statistical data to begin extraction.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-16 pb-32"
                >
                  {data.reports.map((report) => (
                    <div key={report.id} className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[700px] hover:shadow-hanwha-orange/5 transition-all duration-700">
                      <div className="w-full md:w-96 bg-hanwha-gray-dark p-12 border-r border-white/5 flex flex-col shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-hanwha-orange/10 rounded-full -mr-32 -mt-32"></div>
                        <span className="px-4 py-2 bg-hanwha-orange text-white rounded text-[11px] font-black uppercase tracking-[0.3em] mb-8 inline-block w-fit shadow-lg shadow-hanwha-orange/30">
                          {report.country} MI ASSET
                        </span>
                        <h3 className="text-4xl font-black tracking-tighter text-white leading-none mb-12">{report.title}</h3>
                        
                        <div className="mt-auto space-y-8">
                          <div>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2">Generation Index</p>
                            <p className="text-base font-black text-white/80">{format(new Date(report.createdAt), 'yyyy.MM.dd HH:mm')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2">Security Clearance</p>
                            <p className="text-base font-black text-hanwha-orange uppercase tracking-widest">INTERNAL STRATEGY</p>
                          </div>
                          <button className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white text-hanwha-gray-dark rounded-2xl font-black text-xs hover:bg-hanwha-orange hover:text-white transition-all uppercase tracking-[0.3em] shadow-2xl">
                            <Download size={16} /> Download MI Briefing
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-16 space-y-16 scrollbar-hide">
                        {report.sections.map((section, idx) => (
                          <section key={idx} className="relative pl-16 group">
                            <div className="absolute left-0 top-1 w-12 h-12 bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center rounded-2xl text-sm font-black group-hover:bg-hanwha-orange group-hover:text-white group-hover:border-hanwha-orange transition-all duration-500 shadow-sm">
                              0{idx + 1}
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-widest text-hanwha-gray-dark mb-6 border-b border-gray-100 pb-4">
                              {section.title}
                            </h4>
                            <div className="prose prose-slate max-w-none text-hanwha-gray-mid leading-loose text-[14px] font-medium">
                              <Markdown>{section.content}</Markdown>
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  ))}
                  {data.reports.length === 0 && (
                    <div className="text-center py-32">
                      <Globe size={48} className="mx-auto text-gray-200 mb-6" />
                      <h3 className="text-xl font-black text-hanwha-gray-dark uppercase tracking-widest">Decision Base Empty</h3>
                      <p className="text-gray-400 text-sm mt-2 font-medium">Execute synthesis from the AI Analysis Hub to generate intelligence briefings.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <footer className="h-12 bg-white border-t border-gray-100 flex items-center px-10 justify-between shrink-0">
            <div className="flex items-center space-x-6">
              <span className="text-[10px] text-hanwha-gray-mid uppercase font-black tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-hanwha-orange rounded-full"></div>
                Source Verification Enforced
              </span>
              <span className="text-[10px] text-gray-300">|</span>
              <span className="text-[10px] text-gray-400 font-bold italic">Hanwha Aerospace Proprietary Intelligence Asset</span>
            </div>
            <div className="text-[10px] font-black text-hanwha-gray-mid uppercase tracking-[0.2em]">HANWHA AEROSPACE • MI HUB © 2026</div>
          </footer>
        </main>
      </div>
    </div>
  );

}
