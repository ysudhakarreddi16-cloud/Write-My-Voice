
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { ResultDisplay } from './components/ResultDisplay.tsx';
import { Recorder } from './components/Recorder.tsx';
import { VisualScanner } from './components/VisualScanner.tsx';
import { Settings } from './components/Settings.tsx';
import { ExitScreen } from './components/ExitScreen.tsx';
import { ProcessingState, InputMode, AppTab, CreativeTone, AppSettings } from './types.ts';
import { processInput } from './services/geminiService.ts';

const TONES: CreativeTone[] = ['Neutral', 'Action', 'Noir', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('translator');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [creativeTone, setCreativeTone] = useState<CreativeTone>('Neutral');
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [rawTextInput, setRawTextInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showExit, setShowExit] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : {
      autoPlayVoice: false,
      defaultTargetLanguage: 'English',
      defaultTone: 'Neutral',
      hapticFeedback: true,
      uiIntensity: 'High'
    };
  });
  
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    result: null,
  });
  
  const lastInputRef = useRef<{ data: string; mimeType: string; mode: InputMode } | null>(null);

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const handleReset = () => {
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate([30, 30]);
    }
    setActiveTab('translator');
    setInputMode('voice');
    setRawTextInput('');
    setPreviewUrl(null);
    setCreativeTone('Neutral');
    setState({
      isProcessing: false,
      error: null,
      result: null,
    });
    lastInputRef.current = null;
  };

  const performProcessing = async (data: string, mimeType: string, lang: string, mode: InputMode, tab: AppTab, tone: CreativeTone) => {
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await processInput(data, mimeType, mode, tab, lang, tone);
      setState({ isProcessing: false, error: null, result });
      lastInputRef.current = { data, mimeType, mode };
    } catch (err: any) {
      setState({ isProcessing: false, error: err.message || "Error processing input.", result: null });
    }
  };

  const onLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    if (lastInputRef.current) performProcessing(lastInputRef.current.data, lastInputRef.current.mimeType, lang, lastInputRef.current.mode, activeTab, creativeTone);
  };

  const onToneChange = (tone: CreativeTone) => {
    setCreativeTone(tone);
    if (lastInputRef.current) performProcessing(lastInputRef.current.data, lastInputRef.current.mimeType, targetLanguage, lastInputRef.current.mode, activeTab, tone);
  };

  const handleAudioData = async (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      performProcessing(base64, blob.type, targetLanguage, 'voice', activeTab, creativeTone);
    };
  };

  const handleImageData = (base64: string, mimeType: string) => {
    setPreviewUrl(`data:${mimeType};base64,${base64}`);
    performProcessing(base64, mimeType, targetLanguage, 'visual', activeTab, creativeTone);
  };

  if (showExit) {
    return <ExitScreen onCancel={() => setShowExit(false)} />;
  }

  return (
    <div className={`w-full max-w-3xl mx-auto px-1 md:px-4 pb-24 pt-4 min-h-screen overflow-x-hidden selection:bg-indigo-500/30 ${settings.uiIntensity === 'High' ? 'ui-high-intensity' : ''}`}>
      <Header />

      <nav className="flex justify-center mb-6 px-1 sticky top-4 z-50">
        <div className="bg-[#0f172a]/95 backdrop-blur-2xl p-1 rounded-full border border-white/10 flex gap-0.5 shadow-2xl overflow-x-auto no-scrollbar max-w-full relative">
          {(['translator', 'scriptwriter', 'textconverter', 'settings'] as AppTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => { 
                setActiveTab(tab); 
                if(tab !== 'settings' && tab !== activeTab) setState(s => ({...s, result: null, error: null})); 
                if(tab === 'textconverter') setInputMode('text');
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 md:px-5 md:py-4 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] transition-all duration-300 shrink-0 ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-300/40 hover:text-indigo-300'}`}
            >
              <i className={`fa-solid ${
                tab === 'translator' ? 'fa-language' : 
                tab === 'scriptwriter' ? 'fa-clapperboard' : 
                tab === 'textconverter' ? 'fa-file-pen' : 
                'fa-sliders'
              }`}></i>
              <span className="inline">
                {tab === 'textconverter' ? 'Convert' : tab === 'settings' ? 'Settings' : tab === 'scriptwriter' ? 'Script' : 'Translate'}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <main className="space-y-6 w-full px-1 relative">
        {activeTab !== 'settings' && (
          <div className="absolute top-0 right-0 z-10 p-2">
            <button 
              onClick={handleReset}
              className="glass w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-indigo-400/60 hover:text-indigo-400 hover:bg-white/5 transition-all group"
              title="Reset Session"
            >
              <i className="fa-solid fa-rotate-left text-xs md:text-sm group-hover:rotate-[-45deg] transition-transform"></i>
              <span className="absolute right-full mr-2 px-2 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Reset All</span>
            </button>
          </div>
        )}

        {activeTab === 'settings' ? (
          <Settings 
            settings={settings} 
            onSettingsChange={setSettings} 
            onExit={() => setShowExit(true)} 
          />
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 mb-6 animate-in fade-in zoom-in duration-700 w-full overflow-hidden">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-60">Creative Genre</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-4 w-full justify-start md:justify-center">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => onToneChange(t)}
                    className={`px-3.5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all shrink-0 ${creativeTone === t ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-indigo-300/40 hover:border-white/20'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <section className="glass rounded-[2rem] md:rounded-[3.5rem] p-4 md:p-10 shadow-2xl border-white/10 relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <i className="fa-solid fa-atom text-5xl md:text-8xl text-indigo-400 animate-[spin_20s_linear_infinite]"></i>
              </div>

              <div className="flex flex-col items-center gap-6 md:gap-10 w-full">
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/5 shadow-inner max-w-full overflow-hidden">
                  {activeTab !== 'textconverter' && (
                    <button 
                      onClick={() => setInputMode('voice')}
                      className={`px-3 py-2 md:px-6 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${inputMode === 'voice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-300/40'}`}
                    >
                      <i className="fa-solid fa-microphone mr-1.5 md:mr-2"></i> Audio
                    </button>
                  )}
                  {activeTab !== 'textconverter' && (
                    <button 
                      onClick={() => setInputMode('visual')}
                      className={`px-3 py-2 md:px-6 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${inputMode === 'visual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-300/40'}`}
                    >
                      <i className="fa-solid fa-camera mr-1.5 md:mr-2"></i> Visual
                    </button>
                  )}
                  <button 
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-2 md:px-6 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${inputMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-300/40'}`}
                  >
                    <i className="fa-solid fa-keyboard mr-1.5 md:mr-2"></i> Text
                  </button>
                </div>
                
                {inputMode === 'text' ? (
                  <div className="space-y-4 md:space-y-6 w-full animate-in fade-in duration-500">
                    <textarea
                      value={rawTextInput}
                      onChange={(e) => setRawTextInput(e.target.value)}
                      placeholder="Enter raw text or dialogue..."
                      className="w-full h-40 md:h-56 bg-black/40 border border-white/10 rounded-[1.2rem] md:rounded-[2.5rem] p-5 md:p-8 text-indigo-50 placeholder:text-indigo-300/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 resize-none transition-all text-sm md:text-base"
                    />
                    <button
                      onClick={() => performProcessing(rawTextInput, 'text/plain', targetLanguage, 'text', activeTab, creativeTone)}
                      disabled={state.isProcessing || !rawTextInput.trim()}
                      className="w-full py-4 md:py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.2rem] md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {state.isProcessing ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : null}
                      {state.isProcessing ? 'Processing...' : 'Process Text'}
                    </button>
                  </div>
                ) : inputMode === 'voice' ? (
                  <Recorder onRecordingComplete={handleAudioData} disabled={state.isProcessing} />
                ) : (
                  <VisualScanner onImageCaptured={handleImageData} disabled={state.isProcessing} />
                )}
              </div>
            </section>

            <section className="w-full">
              {state.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] md:rounded-[2.5rem] text-red-400 text-center animate-in slide-in-from-top-4 mb-6">
                  <i className="fa-solid fa-triangle-exclamation text-base mb-2"></i>
                  <p className="text-[11px] font-bold">{state.error}</p>
                </div>
              )}
              {state.isProcessing && (
                <div className="flex flex-col items-center py-12 md:py-20 animate-in fade-in zoom-in duration-1000">
                  <div className="w-12 h-12 md:w-20 md:h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-2xl"></div>
                  <div className="text-center space-y-3">
                    <p className="text-indigo-400 font-black tracking-[0.4em] uppercase text-[9px] md:text-[10px]">Processing Reality</p>
                    <p className="text-[8px] md:text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium max-w-[150px] md:max-w-[180px] mx-auto leading-relaxed">Querying Gemini Neural Engine...</p>
                  </div>
                </div>
              )}
              {state.result && (
                <div className="w-full">
                  <ResultDisplay 
                    result={state.result} 
                    languageSelector={<LanguageSelector selectedLanguage={targetLanguage} onLanguageChange={onLanguageChange} />} 
                    targetLanguage={targetLanguage}
                    isUpdating={state.isProcessing}
                    imageUrl={previewUrl}
                    mode={activeTab}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
