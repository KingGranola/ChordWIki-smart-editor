import React, { useState } from 'react';
import { getPaletteChords, ChordComplexity } from '../utils/chordwiki';

interface ChordPaletteProps {
  songKey: string;
  onDragStartItem: (item: { chord: string }) => void;
  onDragEndItem: () => void;
}

export const ChordPalette: React.FC<ChordPaletteProps> = ({ songKey, onDragStartItem, onDragEndItem }) => {
  const [complexity, setComplexity] = useState<ChordComplexity>('triad');
  
  const palette = getPaletteChords(songKey, complexity);

  const renderChip = (chord: string) => (
    <div
      key={chord}
      draggable
      onDragStart={e => {
        e.currentTarget.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'palette', chord }));
        onDragStartItem({ chord });
      }}
      onDragEnd={e => {
        e.currentTarget.classList.remove('is-dragging');
        onDragEndItem();
      }}
      className="palette-chip"
    >
      {chord}
    </div>
  );

  return (
    <div className="palette-bar flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="palette-label">Chord Palette — drag onto lyrics</div>
        <select 
          value={complexity} 
          onChange={(e) => setComplexity(e.target.value as ChordComplexity)}
          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 outline-none focus:border-blue-500"
        >
          <option value="triad">3和音 (Triads)</option>
          <option value="7th">4和音 (7ths)</option>
          <option value="tension">4和音 (テンション込み)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diatonic (ダイアトニック)</div>
          <div className="flex flex-wrap gap-1.5">
            {palette.diatonic.map(renderChip)}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Secondary Dominant (セカンダリードミナント)</div>
          <div className="flex flex-wrap gap-1.5">
            {palette.secondaryDominant.map(renderChip)}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Subdominant Minor (サブドミナントマイナー)</div>
          <div className="flex flex-wrap gap-1.5">
            {palette.subdominantMinor.map(renderChip)}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Substitute Dominant (裏コード)</div>
          <div className="flex flex-wrap gap-1.5">
            {palette.substituteDominant.map(renderChip)}
          </div>
        </div>
      </div>
    </div>
  );
};
