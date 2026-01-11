import React, { useState, useRef, useEffect } from 'react';
import { VoiceProcessingResult, AppTab } from '../types.ts';
import { generateSpeech, decodeBase64, decodeAudioData } from '../services/geminiService.ts';

interface ResultDisplayProps {
  result: VoiceProcessingResult;
  languageSelector: React.ReactNode;
  targetLanguage: string;
  isUpdating?: boolean;
  imageUrl?: string | null;
  mode?: AppTab;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, languageSelector, targetLanguage, isUpdating, imageUrl, mode = 'translator' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [copiedType, setCopiedType] = useState<'orig' | 'native' | 'roman' | 'trans' | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const isScriptOrConvert = mode === 'scriptwriter' || mode === 'textconverter';

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleAudioPlayback = async () => {
    if (!isPlaying) await startNewPlayback();
    else togglePauseResume();
  };

  const startNewPlayback = async () => {
    if (isLoadingAudio) return;
    setIsLoadingAudio(true);
    try {
      const base64Audio = await generateSpeech(result.target_translation || result.translated_text);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => { setIsPlaying(false); setIsPaused(false); };
      sourceNodeRef.current = source;
      setIsPlaying(true);
      setIsPaused(false);
      source.start(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePauseResume = async () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'running') {
      await audioContextRef.current.suspend();
      setIsPaused(true);
    } else {
      await audioContextRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) try { sourceNodeRef.current.stop(); } catch(e) {}
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleCopy = (text: string, type: 'orig' | 'native' | 'roman' | 'trans') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WriteMyVoice Content',
          text: result.target_translation || result.translated_text,
          url: window.location.href,
        });
      } catch (err) {
        console.debug('Sharing failed', err);
      }
    } else {
      handleCopy(result.target_translation || result.translated_text, 'trans');
    }
  };

  const storyboardLabels = ["Establishing Shot", "Character Close-up", "Medium Action", "Mood/Detail"];
  const validStoryboards = result.storyboard_urls?.map((url, idx) => ({ url, idx })).filter(item => item.url !== "") || [];

  return (
    <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both pb-10 w-full overflow-hidden">
      
      {/* 1. ORIGINAL INPUT */}
      <div className="glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border border-white/5 relative mx-1 shadow-lg">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-comment-dots text-indigo-400 text-xs"></i>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Input Transcription ({result.original_language || 'Detected'})</span>
          </div>
          <button onClick={() => handleCopy(result.original_text, 'orig')} className="p-1.5 text-indigo-400 hover:text-white transition-colors">
            <i className={`fa-solid ${copiedType === 'orig' ? 'fa-check' : 'fa-copy'} text-xs`}></i>
          </button>
        </div>
        <p className="text-xs md:text-lg leading-relaxed text-indigo-50/80 font-medium whitespace-pre-wrap">{result.original_text}</p>
      </div>

      {imageUrl && (
        <div className="glass p-1.5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-white/5 flex justify-center bg-black/40 mx-1">
          <img src={imageUrl} alt="Source" className="max-h-40 md:max-h-60 rounded-xl md:rounded-3xl object-contain" />
        </div>
      )}

      {/* 2. NATIVE SCREENPLAY / PROFESSIONAL VERSION */}
      <div className={`p-0.5 relative overflow-hidden shadow-2xl rounded-[2rem] md:rounded-[3.5rem] mx-1 ${isScriptOrConvert ? 'bg-indigo-900/40' : 'glass bg-indigo-500/5 border-l-4 border-indigo-500'}`}>
        <div className="px-4 md:px-10 py-3 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 md:gap-4">
             <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                <i className={`fa-solid ${isScriptOrConvert ? 'fa-clapperboard text-xs' : 'fa-wand-magic-sparkles text-xs'}`}></i>
             </div>
             <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-300">
              {isScriptOrConvert ? 'Native Professional Script' : `Native Refinement`}
             </span>
          </div>
          <button onClick={() => handleCopy(result.translated_text, 'native')} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-300">
             <i className={`fa-solid ${copiedType === 'native' ? 'fa-check text-[10px] md:text-xs' : 'fa-copy text-[10px] md:text-xs'}`}></i>
          </button>
        </div>

        <div className={`mx-2 md:mx-4 mb-2 md:mb-4 rounded-[1.2rem] md:rounded-[2.5rem] overflow-hidden ${isScriptOrConvert ? 'bg-[#fcfcf2] p-0.5 shadow-inner' : ''}`}>
           <div className={`${isScriptOrConvert ? 'font-mono text-[10px] md:text-sm text-[#2d2d2d] p-4 md:p-12 min-h-[60px]' : 'text-lg md:text-2xl font-bold tracking-tight text-indigo-50 p-6 md:p-10'} leading-relaxed whitespace-pre-wrap`}>
            {result.translated_text}
          </div>
        </div>
      </div>

      {/* 3. ROMANIZATION / PHONETIC GUIDE (Screenplay Style for Script/Convert) */}
      {result.romanized_text && (
        <div className={`p-0.5 relative overflow-hidden shadow-2xl rounded-[2rem] md:rounded-[3.5rem] mx-1 animate-in fade-in slide-in-from-top-4 ${isScriptOrConvert ? 'bg-indigo-900/40' : 'glass bg-indigo-500/5 border-l-4 border-indigo-500'}`}>
          <div className="px-4 md:px-10 py-3 md:py-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 md:gap-4">
               <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                  <i className="fa-solid fa-volume-low text-xs"></i>
               </div>
               <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Phonetic Pronunciation Guide
               </span>
            </div>
            <button onClick={() => handleCopy(result.romanized_text!, 'roman')} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-300">
               <i className={`fa-solid ${copiedType === 'roman' ? 'fa-check text-[10px] md:text-xs' : 'fa-copy text-[10px] md:text-xs'}`}></i>
            </button>
          </div>

          <div className={`mx-2 md:mx-4 mb-2 md:mb-4 rounded-[1.2rem] md:rounded-[2.5rem] overflow-hidden ${isScriptOrConvert ? 'bg-[#fcfcf2] p-0.5 shadow-inner' : ''}`}>
             <div className={`${isScriptOrConvert ? 'font-mono italic text-[10px] md:text-sm text-[#2d2d2d] p-4 md:p-12 min-h-[40px]' : 'text-sm md:text-lg italic font-medium text-indigo-200/60 p-6 md:p-10'} leading-relaxed whitespace-pre-wrap`}>
              {result.romanized_text}
            </div>
          </div>
        </div>
      )}

      {/* 4. TARGET LANGUAGE TRANSLATION */}
      {result.target_translation && (
        <div className={`p-0.5 relative overflow-hidden shadow-2xl rounded-[2rem] md:rounded-[3.5rem] mx-1 ${isScriptOrConvert ? 'bg-indigo-600/20' : 'glass bg-emerald-500/5 border-l-4 border-emerald-500'}`}>
          <div className="px-4 md:px-10 py-3 md:py-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 md:gap-4">
               <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <i className={`fa-solid fa-globe text-xs`}></i>
               </div>
               <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-300">
                {targetLanguage} Version
               </span>
            </div>
            <div className="flex gap-1 md:gap-2">
              <button onClick={handleShare} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-300">
                 <i className="fa-solid fa-share-nodes text-[10px] md:text-xs"></i>
              </button>
              <button onClick={() => handleCopy(result.target_translation!, 'trans')} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-300">
                 <i className={`fa-solid ${copiedType === 'trans' ? 'fa-check text-[10px] md:text-xs' : 'fa-copy text-[10px] md:text-xs'}`}></i>
              </button>
            </div>
          </div>

          <div className={`mx-2 md:mx-4 mb-2 md:mb-4 rounded-[1.2rem] md:rounded-[2.5rem] overflow-hidden ${isScriptOrConvert ? 'bg-[#fcfcf2] p-0.5 shadow-inner' : ''}`}>
             <div className={`${isScriptOrConvert ? 'font-mono text-[10px] md:text-sm text-[#2d2d2d] p-4 md:p-12 min-h-[60px]' : 'text-lg md:text-2xl font-bold tracking-tight text-white p-6 md:p-10'} leading-relaxed whitespace-pre-wrap`}>
              {result.target_translation}
            </div>
          </div>
        </div>
      )}

      {/* STORYBOARD GALLERY - ONLY FOR SCRIPTWRITER */}
      {mode === 'scriptwriter' && validStoryboards.length > 0 && (
        <div className="space-y-4 px-1 w-full animate-in fade-in duration-700">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Visual Storyboard Preview</span>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {validStoryboards.map(({ url, idx }) => (
              <div key={idx} className="relative group rounded-xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/5 aspect-video bg-black/40 animate-in zoom-in duration-700">
                <img src={url} alt={`Storyboard ${idx}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <span className="absolute bottom-1.5 left-2 md:bottom-3 md:left-4 text-[5px] md:text-[7px] font-black uppercase tracking-widest text-indigo-300">{storyboardLabels[idx]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LANGUAGE SELECTOR */}
      <div className="flex flex-col items-center py-2 px-1 w-full">
        {languageSelector && (
          <div className="bg-[#0f172a] p-1 rounded-2xl md:rounded-3xl z-10 w-full max-w-xs md:max-w-sm shadow-2xl border border-white/5 transition-all">
            {languageSelector}
            {isUpdating && (
              <div className="px-4 pb-3 pt-2 animate-in fade-in zoom-in duration-300">
                <div className="h-0.5 w-full bg-indigo-500/10 rounded-full overflow-hidden relative">
                  <div className="h-full bg-indigo-500 w-1/3 absolute top-0 animate-shimmer"></div>
                </div>
                <p className="text-[7px] text-center mt-1.5 text-indigo-400 font-black uppercase tracking-[0.3em]">Neural Synthesis active...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TTS CONTROLS */}
      <div className="flex flex-col items-center gap-3 mt-2 w-full px-1">
        <div className="flex items-center gap-3 md:gap-6 bg-[#0f172a]/80 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl max-w-full">
          <button
            onClick={handleAudioPlayback}
            disabled={isLoadingAudio || isUpdating}
            className={`flex items-center gap-2.5 md:gap-4 px-6 py-3.5 md:px-12 md:py-5 rounded-full transition-all duration-500 font-black text-[9px] md:text-[12px] uppercase tracking-widest shrink-0 ${isPlaying ? 'bg-indigo-600 text-white' : 'bg-white/10 text-indigo-200'}`}
          >
            {isLoadingAudio ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className={`fa-solid ${isPlaying && !isPaused ? 'fa-pause' : 'fa-play'}`}></i> {isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play Translation'}</>}
          </button>
          {isPlaying && (
            <button onClick={stopPlayback} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 active:scale-90 shrink-0">
              <i className="fa-solid fa-stop text-xs"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};