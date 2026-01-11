
import React from 'react';

interface ExitScreenProps {
  onCancel: () => void;
}

export const ExitScreen: React.FC<ExitScreenProps> = ({ onCancel }) => {
  const handleExit = () => {
    // Try native app exit first (Capacitor/Cordova plugin style)
    if ((window as any).navigator?.app?.exitApp) {
      (window as any).navigator.app.exitApp();
    } else {
      // Fallback for standard browser/webview
      window.close();
      // Additional fallback: navigate away or clear session
      window.location.href = "about:blank";
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#0f172a] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-[2rem] bg-indigo-600/20 flex items-center justify-center mb-8 ring-1 ring-indigo-500/30">
        <i className="fa-solid fa-power-off text-5xl text-indigo-400"></i>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-4 text-center">Ready to exit?</h1>
      <p className="text-indigo-300/60 text-center max-w-xs mb-12 leading-relaxed text-sm">
        All active translations and screenplays will be cleared. Are you sure you want to close the application?
      </p>
      
      <div className="w-full max-w-xs space-y-4">
        <button 
          onClick={handleExit} 
          className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
        >
          Confirm Close
        </button>
        
        <button 
          onClick={onCancel} 
          className="w-full py-5 bg-white/5 text-indigo-300 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] border border-white/10 active:scale-95 transition-all"
        >
          Stay in App
        </button>
      </div>
      
      <div className="absolute bottom-12 text-[9px] font-black text-indigo-400/10 uppercase tracking-[1em]">
        Write My Voice Mobile
      </div>
    </div>
  );
};
