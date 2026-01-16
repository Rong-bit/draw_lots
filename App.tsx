
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Trophy, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  ListOrdered,
  LayoutGrid,
  Volume2,
  Zap,
  PartyPopper,
  FileDown,
  FilePlus,
  Sparkles,
  Info,
  Download,
  AlertCircle,
  Eye,
  History,
  Check,
  UserCheck,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  DrawMethod, 
  ResultDisplay, 
  SoundEffect, 
  Prize, 
  Participant, 
  DrawSettings, 
  DrawWinner 
} from './types';
import { playSound } from './lib/audio';

// --- Components ---

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col mb-4">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        {icon}
      </div>
      <h2 className="text-md font-bold text-gray-800">{title}</h2>
    </div>
    {subtitle && <p className="text-[10px] text-gray-400 mt-1 ml-10 font-medium tracking-wide">{subtitle}</p>}
  </div>
);

const App: React.FC = () => {
  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [theme, setTheme] = useState('專業抽籤系統 Pro Draw');
  const [prizeInput, setPrizeInput] = useState('特獎 1\n頭獎 2\n貳獎 5');
  const [participantInput, setParticipantInput] = useState('林宥嘉 0917xxx123\n陳美蓉 0922xxx456\n張志豪 0915xxx418\n黃靜怡 0942xxx872\n周柏宇 0952xxx163');
  const [results, setResults] = useState<DrawWinner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeDrawName, setActiveDrawName] = useState<string>('');
  const [spinningName, setSpinningName] = useState<string>('');

  const [settings, setSettings] = useState<DrawSettings>({
    method: DrawMethod.STEP_BY_STEP,
    noDuplicate: true,
    removeFromList: false,
    allowMultiplePrizes: false,
    weightedProbability: true,
    displayMode: ResultDisplay.IN_PAGE,
    showSerialNumber: true,
    verticalResult: true,
    soundEffect: SoundEffect.SOUND_1,
    showConfetti: true,
    fastMode: false,
  });

  // --- Derived State ---
  const prizes = useMemo((): Prize[] => {
    return prizeInput.split('\n').filter(line => line.trim()).map((line, idx) => {
      const parts = line.trim().split(/\s+/);
      const lastPart = parts[parts.length - 1];
      const count = parseInt(lastPart);
      if (isNaN(count)) return { id: String(idx), name: line, count: 1 };
      return { id: String(idx), name: parts.slice(0, -1).join(' '), count };
    });
  }, [prizeInput]);

  const participants = useMemo((): Participant[] => {
    return participantInput.split('\n').filter(line => line.trim()).map((line, idx) => ({
      id: String(idx),
      name: line.trim(),
      raw: line.trim()
    }));
  }, [participantInput]);

  const allPrizeSlots = useMemo(() => {
    let slots: string[] = [];
    prizes.forEach(p => {
      for (let i = 0; i < p.count; i++) slots.push(p.name);
    });
    if (settings.method === DrawMethod.REVERSE) {
      slots.reverse();
    }
    return slots;
  }, [prizes, settings.method]);

  const remainingSlots = useMemo(() => {
    return allPrizeSlots.slice(results.length);
  }, [allPrizeSlots, results.length]);

  // --- Helpers ---
  const triggerConfetti = () => {
    if (!settings.showConfetti) return;
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // --- Handlers ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setParticipantInput(event.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const BOM = '\uFEFF';
    let csv = "流水號,獎項,中獎者\n" + results.map((r, i) => 
      `${r.serialNumber || i + 1},"${r.prizeName}","${r.winner.name}"`
    ).join("\n");
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme}_結果_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleReset = () => {
    if (results.length > 0 && !confirm('確定要清除目前所有中獎結果嗎？')) return;
    setResults([]);
    setShowResultModal(false);
    setActiveDrawName('');
    setSpinningName('');
  };

  const performSingleDraw = async (prizeName: string, currentResults: DrawWinner[], pool: Participant[], usedNames: Set<string>, index: number) => {
    setActiveDrawName(prizeName);
    
    let eligible = [];
    if (settings.weightedProbability) {
      eligible = pool.filter(p => !usedNames.has(p.name));
    } else {
      const seen = new Set();
      eligible = pool.filter(p => {
        if (!seen.has(p.name) && !usedNames.has(p.name)) {
          seen.add(p.name);
          return true;
        }
        return false;
      });
    }

    if (eligible.length === 0) return null;

    if (!settings.fastMode) {
      const spinCount = 12;
      for (let s = 0; s < spinCount; s++) {
        setSpinningName(eligible[Math.floor(Math.random() * eligible.length)].name);
        await new Promise(r => setTimeout(r, 50 + s * 8));
      }
    }

    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    if (settings.noDuplicate) usedNames.add(winner.name);

    const result: DrawWinner = {
      prizeName,
      winner,
      serialNumber: settings.showSerialNumber ? index + 1 : undefined
    };

    if (settings.soundEffect !== SoundEffect.NONE) playSound(settings.soundEffect);
    
    return result;
  };

  const handleDraw = useCallback(async () => {
    if (remainingSlots.length === 0) {
      alert('所有獎項已抽完！');
      return;
    }
    if (participants.length === 0) {
      alert('參加名單為空！');
      return;
    }

    setIsDrawing(true);
    const usedNames = new Set<string>();
    if (settings.noDuplicate) {
      results.forEach(r => usedNames.add(r.winner.name));
    }

    let updatedResults = [...results];
    let pool = [...participants];

    if (settings.method === DrawMethod.ALL_AT_ONCE) {
      for (let i = 0; i < remainingSlots.length; i++) {
        const slotIdx = results.length + i;
        const res = await performSingleDraw(remainingSlots[i], updatedResults, pool, usedNames, slotIdx);
        if (res) {
          updatedResults.push(res);
          if (!settings.fastMode) {
            setResults([...updatedResults]);
            await new Promise(r => setTimeout(r, 300));
          }
        } else {
          break;
        }
      }
      setResults(updatedResults);
    } else {
      const slotIdx = results.length;
      const res = await performSingleDraw(remainingSlots[0], updatedResults, pool, usedNames, slotIdx);
      if (res) {
        updatedResults.push(res);
        setResults(updatedResults);
      }
    }

    setIsDrawing(false);
    setActiveDrawName('');
    setSpinningName('');
    triggerConfetti();

    if (settings.removeFromList && settings.noDuplicate) {
      const currentUsed = new Set(updatedResults.map(r => r.winner.name));
      const remainingRaw = participants.filter(p => !currentUsed.has(p.name)).map(p => p.raw).join('\n');
      setParticipantInput(remainingRaw);
    }

    if (settings.displayMode === ResultDisplay.POPUP && updatedResults.length > results.length) {
      setShowResultModal(true);
    }
  }, [participants, results, remainingSlots, settings]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header: Theme Input & Controls */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex-1 w-full text-center md:text-left">
            <input 
              type="text" 
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="text-2xl md:text-3xl font-black text-slate-800 bg-transparent border-none focus:ring-0 w-full hover:bg-slate-50 rounded-xl px-4 py-1 transition-all"
              placeholder="輸入抽獎活動主題..."
            />
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1 px-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {results.length > 0 ? `已抽 ${results.length} / 共 ${allPrizeSlots.length} 名額` : '準備就緒 - 隨時可以開獎'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-4 bg-slate-50 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all border border-slate-100 active:scale-90 flex items-center gap-2 font-bold text-sm"
              title="規則設定"
            >
              <Settings size={20} />
              <span className="hidden md:inline">規則設定</span>
            </button>
            <button 
              onClick={handleReset}
              className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 active:scale-90"
              title="重置結果"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={handleDraw}
              disabled={isDrawing || remainingSlots.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95 transform ${
                isDrawing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 
                remainingSlots.length === 0 ? 'bg-emerald-50 text-emerald-300 cursor-not-allowed border border-emerald-100' :
                'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-indigo-200'
              }`}
            >
              {isDrawing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play fill="currentColor" size={20} />}
              {isDrawing ? '正在抽獎...' : (remainingSlots.length === 0 ? '獎項已抽完' : results.length > 0 ? '抽取下一位' : '開始抽獎')}
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prize List */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<Trophy size={18} />} title="獎項內容" subtitle={`目前剩餘 ${remainingSlots.length} 個名額未抽出`} />
                {remainingSlots.length > 0 && !isDrawing && (
                  <div className="px-3 py-1 bg-indigo-50 rounded-full animate-pulse border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                      <Eye size={10} /> 下一個：{remainingSlots[0]}
                    </p>
                  </div>
                )}
              </div>
              <textarea 
                value={prizeInput}
                onChange={e => setPrizeInput(e.target.value)}
                disabled={results.length > 0}
                className={`w-full h-40 mt-4 p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 font-medium text-slate-700 text-sm leading-relaxed resize-none ${results.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="點此輸入獎項內容...&#10;範例：&#10;特獎 1&#10;頭獎 3"
              />
              <div className="flex items-center gap-2 mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <Info size={14} className="text-indigo-500" />
                <p className="text-[11px] text-indigo-600/70 font-medium">格式：[名稱] [數量]。抽獎開始後不可修改獎項。</p>
              </div>
            </div>

            {/* Participant List */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<Users size={18} />} title="參加名單" subtitle={`目前已加入 ${participants.length} 位`} />
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="匯入名單 (.txt)"
                  >
                    <FilePlus size={16} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".txt,.csv" className="hidden" />
                </div>
              </div>
              <textarea 
                value={participantInput}
                onChange={e => setParticipantInput(e.target.value)}
                className="w-full h-40 mt-4 p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 font-medium text-slate-700 text-sm leading-relaxed resize-none"
                placeholder="每行一筆名單資料...&#10;可直接從 Excel 貼上"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400">名單上限：300,000 筆</span>
                <button onClick={() => setParticipantInput('林宥嘉 0917xxx123\n陳美蓉 0922xxx456\n張志豪 0915xxx418\n黃靜怡 0942xxx872\n周柏宇 0952xxx163')} className="text-[10px] font-bold text-indigo-500 hover:underline">載入範例名單</button>
              </div>
            </div>
          </div>

          {/* Drawing Ritual Section */}
          {isDrawing && !settings.fastMode && (
            <div className="bg-indigo-600 rounded-[2rem] p-10 text-white text-center relative overflow-hidden shadow-2xl shadow-indigo-200">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="flex animate-scrollHorizontal gap-20 py-4 opacity-50">
                     {participants.slice(0, 10).map((p, i) => <span key={i} className="text-2xl font-black whitespace-nowrap">{p.name}</span>)}
                  </div>
                  <div className="flex animate-scrollHorizontalReverse gap-20 py-4 opacity-30 mt-10">
                     {participants.slice(10, 20).map((p, i) => <span key={i} className="text-2xl font-black whitespace-nowrap">{p.name}</span>)}
                  </div>
               </div>
               <div className="relative z-10 flex flex-col items-center">
                  <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.3em] mb-4">正在抽取獎項</p>
                  <h3 className="text-3xl font-black mb-8 px-8 py-3 bg-white/10 rounded-2xl backdrop-blur-md">{activeDrawName}</h3>
                  <div className="h-24 flex items-center justify-center">
                     <span className="text-6xl md:text-7xl font-black tracking-tighter drop-shadow-2xl animate-pulse">
                       {spinningName || 'Ready...'}
                     </span>
                  </div>
               </div>
            </div>
          )}

          {/* Results Display */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm min-h-[300px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <SectionTitle icon={<ListOrdered size={18} />} title="抽獎結果" subtitle={`已累計抽出 ${results.length} 個名額`} />
                {results.length > 0 && (
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                  >
                    <Download size={14} /> 匯出 CSV
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setSettings(s => ({...s, verticalResult: !s.verticalResult}))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${settings.verticalResult ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FileDown className={settings.verticalResult ? "" : "rotate-90"} size={14} /> 垂直排列
                </button>
                <button 
                  onClick={() => setSettings(s => ({...s, displayMode: s.displayMode === ResultDisplay.POPUP ? ResultDisplay.IN_PAGE : ResultDisplay.POPUP}))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${settings.displayMode === ResultDisplay.POPUP ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={14} /> 視窗顯示
                </button>
              </div>
            </div>

            {results.length > 0 ? (
              <div className={`grid gap-4 ${settings.verticalResult ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {([...results].reverse()).map((r, i) => (
                  <div 
                    key={`${r.winner.id}-${i}`} 
                    className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all animate-drawPop"
                  >
                    <div className="flex items-center gap-4">
                      {settings.showSerialNumber && (
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black">
                          #{r.serialNumber}
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{r.prizeName}</p>
                        <p className="text-xl font-black text-slate-800 tracking-tight">{r.winner.name}</p>
                      </div>
                    </div>
                    <div className="text-emerald-500 scale-100 transition-transform">
                      <CheckCircle2 size={24} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !isDrawing && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={32} className="opacity-20" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest">點擊開始抽獎...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-modalScale">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                      <Settings size={24} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-800">規則設定</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">自定義您的抽獎邏輯與體驗</p>
                   </div>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all">
                   <X size={20} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Method */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">抽獎方式</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: DrawMethod.STEP_BY_STEP, label: '分次抽出' },
                      { id: DrawMethod.ALL_AT_ONCE, label: '一次抽完' },
                      { id: DrawMethod.REVERSE, label: '倒序抽獎' }
                    ].map(m => (
                      <button 
                        key={m.id}
                        onClick={() => {
                          if (results.length > 0 && !confirm('更換抽獎方式建議先重置結果，是否繼續？')) return;
                          setSettings(s => ({...s, method: m.id as DrawMethod}));
                        }}
                        className={`px-4 py-4 rounded-2xl border-2 font-bold transition-all text-sm ${settings.method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">中獎規則</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                       <button 
                         onClick={() => setSettings(s => ({...s, noDuplicate: true, allowMultiplePrizes: false}))}
                         className={`flex items-center gap-3 p-4 w-full rounded-2xl border-2 transition-all group ${settings.noDuplicate ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'}`}
                       >
                         <UserCheck size={20} className={settings.noDuplicate ? "text-indigo-600" : "text-slate-400"} />
                         <span className="text-sm font-bold">不得重複中獎</span>
                       </button>
                       
                       {settings.noDuplicate && (
                         <div className="pl-6 animate-slideIn">
                           <label className="flex items-center gap-3 cursor-pointer group p-2">
                             <input 
                               type="checkbox" 
                               checked={settings.removeFromList}
                               onChange={e => setSettings(s => ({...s, removeFromList: e.target.checked}))}
                               className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                             />
                             <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">並從名單中移除中獎者</span>
                           </label>
                         </div>
                       )}

                       <button 
                         onClick={() => setSettings(s => ({...s, noDuplicate: false, allowMultiplePrizes: true, removeFromList: false}))}
                         className={`flex items-center gap-3 p-4 w-full rounded-2xl border-2 transition-all group ${!settings.noDuplicate ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'}`}
                       >
                         <UserPlus size={20} className={!settings.noDuplicate ? "text-indigo-600" : "text-slate-400"} />
                         <span className="text-sm font-bold">允許獲得多種獎項</span>
                       </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border-2 border-transparent cursor-pointer hover:border-indigo-200 transition-all group">
                        <input 
                          type="checkbox" 
                          checked={settings.weightedProbability}
                          onChange={e => setSettings(s => ({...s, weightedProbability: e.target.checked}))}
                          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 leading-tight">重複次數越高，<br/>中獎機率越高 (權重)</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border-2 border-transparent cursor-pointer hover:border-indigo-200 transition-all group">
                        <input 
                          type="checkbox" 
                          checked={settings.showSerialNumber}
                          onChange={e => setSettings(s => ({...s, showSerialNumber: e.target.checked}))}
                          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">在結果中添加流水號</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* FX */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">視覺與音效</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setSettings(s => ({...s, soundEffect: s.soundEffect === SoundEffect.SOUND_1 ? SoundEffect.NONE : SoundEffect.SOUND_1}))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${settings.soundEffect === SoundEffect.SOUND_1 ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                    >
                      <Volume2 size={16} /> 抽獎音效 1
                    </button>
                    <button 
                      onClick={() => setSettings(s => ({...s, soundEffect: s.soundEffect === SoundEffect.SOUND_2 ? SoundEffect.NONE : SoundEffect.SOUND_2}))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${settings.soundEffect === SoundEffect.SOUND_2 ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                    >
                      <Volume2 size={16} /> 抽獎音效 2
                    </button>
                    <button 
                      onClick={() => setSettings(s => ({...s, showConfetti: !s.showConfetti}))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${settings.showConfetti ? 'bg-pink-50 border-pink-400 text-pink-700' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                    >
                      <PartyPopper size={16} /> 顯示彩帶動畫
                    </button>
                    <button 
                      onClick={() => setSettings(s => ({...s, fastMode: !s.fastMode}))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${settings.fastMode ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                    >
                      <Zap size={16} /> 快速模式
                    </button>
                  </div>
                </div>
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 rounded-b-[2.5rem]">
                <button 
                   onClick={() => setShowSettingsModal(false)}
                   className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                   <Check size={20} />
                   完成設定
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-modalScale">
             <div className="p-8 md:p-12 bg-indigo-600 rounded-t-[2.5rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12">
                   <Trophy size={200} />
                </div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black flex items-center gap-4 mb-2">
                       <span className="text-5xl">🎊</span>
                       抽獎結果更新！
                    </h2>
                    <p className="text-indigo-100 font-bold ml-16">恭喜以下幸運兒中獎：</p>
                  </div>
                  <button onClick={() => setShowResultModal(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <X size={24} />
                  </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(settings.method === DrawMethod.ALL_AT_ONCE ? results : [results[results.length - 1]]).map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-50 flex items-center justify-center rounded-2xl text-2xl">
                               🏆
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{r.prizeName}</p>
                               <p className="text-2xl font-black text-slate-800">{r.winner.name}</p>
                            </div>
                         </div>
                         <CheckCircle2 className="text-emerald-500" size={24} />
                      </div>
                   ))}
                </div>
                {results.length > 1 && settings.method !== DrawMethod.ALL_AT_ONCE && (
                   <div className="mt-6 p-4 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-400">
                      <History size={14} />
                      <p className="text-xs font-bold uppercase tracking-widest">目前累計共 {results.length} 位中獎者</p>
                   </div>
                )}
             </div>
             
             <div className="p-8 bg-white border-t border-slate-100 rounded-b-[2.5rem] flex justify-center gap-4">
                <button 
                  onClick={handleExport}
                  className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <Download size={20} /> 匯出結果
                </button>
                <button 
                  onClick={() => setShowResultModal(false)}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  關閉視窗
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Global CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScale { from { opacity: 0; transform: scale(0.9) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes scrollHorizontal { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes scrollHorizontalReverse { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes drawPop { 
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-modalScale { animation: modalScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scrollHorizontal { animation: scrollHorizontal 20s linear infinite; }
        .animate-scrollHorizontalReverse { animation: scrollHorizontalReverse 20s linear infinite; }
        .animate-drawPop { animation: drawPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default App;
