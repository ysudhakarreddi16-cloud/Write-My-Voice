
import React, { useState, useRef, useEffect } from 'react';

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled: boolean;
}

export const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError("Microphone access denied. Please enable it in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setPermissionError("No microphone found on this device.");
      } else {
        setPermissionError("Could not access microphone. Please check your permissions.");
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled && !isRecording}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative ${
          isRecording 
            ? 'bg-red-500 animate-pulse hover:bg-red-600' 
            : permissionError 
              ? 'bg-amber-500/20 border-2 border-amber-500/50 text-amber-500'
              : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        <i className={`fa-solid ${isRecording ? 'fa-stop text-xl' : permissionError ? 'fa-triangle-exclamation text-xl' : 'fa-microphone text-2xl'} text-white`}></i>
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
        )}
      </button>
      
      <div className="mt-4 text-center px-4">
        {permissionError ? (
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
            {permissionError}
            <br />
            <span className="text-white/40 cursor-pointer hover:text-white" onClick={startRecording}>Click to retry</span>
          </p>
        ) : (
          <span className={`text-xs font-black uppercase tracking-[0.2em] ${isRecording ? 'text-red-400' : 'text-indigo-300'}`}>
            {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Tap to Start Capture'}
          </span>
        )}
      </div>
    </div>
  );
};
