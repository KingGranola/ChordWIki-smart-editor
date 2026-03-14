import React, { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { getDiatonicChords } from '../utils/chordwiki';

interface ChordPopupProps {
  initialValue: string;
  songKey: string;
  showDelete?: boolean;
  onSave: (value: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const ChordPopup: React.FC<ChordPopupProps> = ({
  initialValue,
  songKey,
  showDelete = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const chords = getDiatonicChords(songKey);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSave(e.currentTarget.value);
    else if (e.key === 'Escape') onClose();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay to allow mousedown on buttons to fire first
    setTimeout(() => onSave(e.target.value), 120);
  };

  return (
    <div className="chord-popup" onClick={e => e.stopPropagation()}>
      <div className="flex gap-1.5 items-center mb-2">
        <input
          ref={inputRef}
          autoFocus
          className="chord-popup-input"
          defaultValue={initialValue}
          placeholder="Chord…"
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        {showDelete && onDelete && (
          <button
            onMouseDown={e => { e.preventDefault(); onDelete(); }}
            className="icon-btn-danger"
            title="Remove chord"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="chord-popup-grid">
        {chords.map(c => (
          <button
            key={c}
            onMouseDown={e => { e.preventDefault(); onSave(c); }}
            className="chord-quick-btn"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};
