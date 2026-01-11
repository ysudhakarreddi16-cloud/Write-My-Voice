
import React, { useEffect, useState } from 'react';

interface AdUnitProps {
  slotId: string;
  type?: 'banner' | 'rectangle' | 'interstitial';
  className?: string;
  onClose?: () => void;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, type = 'banner', className = '', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdMob: Script not yet initialized');
    }

    if (type === 'interstitial') {
      // Compliance: Allow skip after a short delay to ensure ad is viewed
      const timer = setTimeout(() => setCanSkip(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [slotId, type]);

  if (!isVisible) return null;

  // INTERSTITIAL AD (Full Screen Modal)
  if (type === 'interstitial') {
    return (
      <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <div className={`h-full bg-indigo-500 transition-all duration-[2000ms] ease-linear ${canSkip ? 'w-full' : 'w-0'}`}></div>
        </div>
        
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <i className="fa-solid fa-rectangle-ad text-xs"></i>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sponsored Advertisement</span>
          </div>

          <div className="glass w-full rounded-[3rem] p-4 border-white/20 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden bg-black/40">
            {/* Real Ad Slot */}
            <ins 
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', height: '100%' }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot={slotId}
              data-ad-format="rectangle"
            ></ins>
            
            {/* Placeholder Visuals */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
               <i className="fa-solid fa-clapperboard text-8xl text-indigo-400 mb-4"></i>
               <p className="text-[10px] font-bold uppercase tracking-widest">Premium Content Loading</p>
            </div>
          </div>

          <button 
            disabled={!canSkip}
            onClick={() => { setIsVisible(false); onClose?.(); }}
            className={`mt-10 w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 ${
              canSkip 
              ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 active:scale-95' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {canSkip ? 'Continue to App' : 'Wait...'}
          </button>
        </div>
      </div>
    );
  }

  // STANDARD BANNER / RECTANGLE
  return (
    <div className={`w-full flex flex-col items-center my-6 ${className}`}>
      <div className="flex items-center gap-2 mb-2 self-start px-2 opacity-30">
        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Advertisement</span>
      </div>
      
      <div 
        className={`glass w-full rounded-[2rem] overflow-hidden flex items-center justify-center border-dashed border-white/10 group relative ${
          type === 'banner' ? 'h-20' : 'min-h-[250px]'
        }`}
      >
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slotId}
          data-ad-format={type === 'banner' ? 'horizontal' : 'rectangle'}
          data-full-width-responsive="true"
        ></ins>
        
        {/* Placeholder if ad is blocked or loading */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
           <i className={`fa-solid ${type === 'banner' ? 'fa-rectangle-ad' : 'fa-rectangle-vertical-history'} text-4xl text-indigo-400`}></i>
        </div>
      </div>
    </div>
  );
};
