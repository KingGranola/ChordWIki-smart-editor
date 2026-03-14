import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    // Fake progress bar that goes up to 90%
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Sounds...</h3>
        <p className="text-gray-500 mb-6 text-sm">
          ピアノ音源を読み込んでいます。<br />少々お待ちください。
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
