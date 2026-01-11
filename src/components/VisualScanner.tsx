
import React, { useState, useRef, useEffect } from 'react';

interface VisualScannerProps {
  onImageCaptured: (base64: string, mimeType: string) => void;
  disabled: boolean;
}

export const VisualScanner: React.FC<VisualScannerProps> = ({ onImageCaptured, disabled }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (showCamera) {
      const setupCamera = async () => {
        setCamError(null);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment', 
              width: { ideal: 1080 }, 
              height: { ideal: 1080 } 
            } 
          });
          activeStream = stream;
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err: any) {
          console.error("Camera access error:", err);
          setShowCamera(false);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCamError("Camera access denied. Please check site permissions.");
          } else {
            setCamError("Could not initialize camera.");
          }
        }
      };
      setupCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const startCamera = () => {
    setShowCamera(true);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        onImageCaptured(base64, 'image/jpeg');
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        onImageCaptured(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full px-1">
      {showCamera ? (
        <div className="relative w-full aspect-square max-w-full overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-4 border-indigo-500/30 bg-black shadow-2xl animate-in zoom-in duration-300">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 border-[20px] md:border-[30px] border-black/10 pointer-events-none"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 md:w-48 md:h-48 border border-white/20 rounded-3xl"></div>
          </div>
          <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-4 md:gap-6 z-10">
            <button
              onClick={capturePhoto}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform ring-4 ring-white/20"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-slate-900"></div>
            </button>
            <button
              onClick={stopCamera}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center shadow-2xl text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-xl md:text-2xl"></i>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <div className="w-full space-y-4">
          {camError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-400 mb-2 animate-in slide-in-from-top-2">
              <i className="fa-solid fa-camera-slash text-sm"></i>
              <p className="text-[10px] font-bold uppercase tracking-wider">{camError}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
            <button
              onClick={startCamera}
              disabled={disabled}
              className="flex-1 flex flex-col items-center justify-center gap-2 p-6 md:p-8 glass rounded-[1.5rem] md:rounded-[2rem] hover:bg-indigo-500/10 transition-all border-white/10 group disabled:opacity-50"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-camera text-xl md:text-2xl text-indigo-400"></i>
              </div>
              <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em]">Open Camera</span>
            </button>

            <label className={`flex-1 flex flex-col items-center justify-center gap-2 p-6 md:p-8 glass rounded-[1.5rem] md:rounded-[2rem] hover:bg-indigo-500/10 transition-all border-white/10 group cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-image text-xl md:text-2xl text-indigo-400"></i>
              </div>
              <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em]">Upload Scene</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      )}
      
      {!showCamera && !camError && (
        <div className="flex items-center gap-2 mt-1">
          <i className="fa-solid fa-circle-info text-[9px] text-indigo-400/60"></i>
          <p className="text-[9px] text-indigo-300/30 uppercase tracking-[0.1em] md:tracking-[0.2em] font-black">
            Point at text, storyboards, or scripts
          </p>
        </div>
      )}
    </div>
  );
};
