
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-8 px-4 text-center">
      <div className="inline-block p-3 rounded-2xl bg-indigo-600/20 mb-4 ring-1 ring-indigo-500/30">
        <i className="fa-solid fa-microphone-lines text-4xl text-indigo-400"></i>
      </div>
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
        Write My Voice
      </h1>
      <p className="mt-2 text-indigo-200/60 max-w-md mx-auto">
        Your intelligent bridge across languages. Transcribe, translate, and scan text instantly via voice or camera.
      </p>
    </header>
  );
};
