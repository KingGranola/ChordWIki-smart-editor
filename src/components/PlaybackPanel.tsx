import React, { useEffect } from 'react';
import { Play, Square, Settings2, Loader2 } from 'lucide-react';
import { VoicingMode } from '../utils/voicing';
import { stopAudio } from '../utils/audio';

interface PlaybackPanelProps {
  isAudioReady: boolean;
  isAudioLoading: boolean;
  onInitAudio: () => void;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  voicingMode: VoicingMode;
  onVoicingModeChange: (mode: VoicingMode) => void;
}

export const PlaybackPanel: React.FC<PlaybackPanelProps> = ({
  isAudioReady, isAudioLoading, onInitAudio,
  isPlaying, onPlay, onStop, bpm, onBpmChange, voicingMode, onVoicingModeChange
}) => {
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="chord-palette flex items-center gap-4 p-4 bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0">
      {!isAudioReady ? (
        <button 
          onClick={onInitAudio}
          disabled={isAudioLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isAudioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isAudioLoading ? "Loading Sounds..." : "Load Piano Sounds"}
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button onClick={onPlay} className="btn-primary flex items-center gap-2 bg-[var(--success)] border-[var(--success)] hover:bg-emerald-600 text-white">
                <Play className="w-4 h-4" /> Play
              </button>
            ) : (
              <button onClick={onStop} className="btn-primary flex items-center gap-2 bg-[var(--danger)] border-[var(--danger)] hover:bg-red-600 text-white">
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-[var(--border)] mx-2"></div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-[var(--text-2)]">BPM</label>
            <input 
              type="number" 
              value={bpm} 
              onChange={e => onBpmChange(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-[var(--bg-base)] border border-[var(--border)] rounded text-sm text-[var(--text-1)]"
              min="40" max="240"
            />
          </div>

          <div className="w-px h-6 bg-[var(--border)] mx-2"></div>

          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[var(--text-3)]" />
            <label className="text-sm font-bold text-[var(--text-2)]">Voicing</label>
            <select 
              value={voicingMode}
              onChange={e => onVoicingModeChange(e.target.value as VoicingMode)}
              className="px-2 py-1 bg-[var(--bg-base)] border border-[var(--border)] rounded text-sm text-[var(--text-1)]"
            >
              <option value="Closed">Closed</option>
              <option value="Shell">Shell</option>
              <option value="Rootless">Rootless</option>
              <option value="Drop 2">Drop 2</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
