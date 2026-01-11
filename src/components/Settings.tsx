
import React from 'react';
import { AppSettings, SUPPORTED_LANGUAGES, CreativeTone } from '../types.ts';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onExit: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange, onExit }) => {
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const TONES: CreativeTone[] = ['Neutral', 'Action', 'Noir', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass rounded-[3rem] p-8 border-white/10 space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i className="fa-solid fa-gear text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">General Settings</h2>
            <p className="text-[10px] text-indigo-300/40 uppercase tracking-widest font-black">Configure your experience</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <span className="text-xs font-bold text-indigo-100 block">Auto-Play Voice</span>
              <span className="text-[9px] text-indigo-300/40 uppercase tracking-widest font-black">Play audio after translate</span>
            </div>
            <button 
              onClick={() => updateSetting('autoPlayVoice', !settings.autoPlayVoice)}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.autoPlayVoice ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.autoPlayVoice ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <span className="text-xs font-bold text-indigo-100 block">Haptic Feedback</span>
              <span className="text-[9px] text-indigo-300/40 uppercase tracking-widest font-black">Vibrate on interaction</span>
            </div>
            <button 
              onClick={() => updateSetting('hapticFeedback', !settings.hapticFeedback)}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.hapticFeedback ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.hapticFeedback ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        {/* Selects */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Default Target Language</label>
            <select
              value={settings.defaultTargetLanguage}
              onChange={(e) => updateSetting('defaultTargetLanguage', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name} className="bg-slate-900">{l.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Default Creative Genre</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(tone => (
                <button
                  key={tone}
                  onClick={() => updateSetting('defaultTone', tone)}
                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${settings.defaultTone === tone ? 'bg-indigo-600 text-white' : 'bg-white/5 text-indigo-300/60 border border-white/5'}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* UI Intensity */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Visual Style</label>
          <div className="flex gap-4">
            {(['Soft', 'High'] as const).map(intensity => (
              <button
                key={intensity}
                onClick={() => updateSetting('uiIntensity', intensity)}
                className={`flex-1 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${settings.uiIntensity === intensity ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' : 'bg-white/5 border-white/10 text-indigo-300/40'}`}
              >
                {intensity} Intensity
              </button>
            ))}
          </div>
        </div>

        {/* Exit Button */}
        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={onExit}
            className="w-full py-5 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 font-black uppercase tracking-widest text-[11px] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Exit Application
          </button>
        </div>
      </div>
      
      <div className="text-center space-y-2 opacity-30 pb-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Write My Voice Professional v1.2.0</p>
        <p className="text-[8px] uppercase tracking-widest">Managed by AI Engine Gemini 2.5/3.0</p>
      </div>
    </div>
  );
};
