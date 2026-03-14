import React from 'react';
import { AlignLeft, Settings2 } from 'lucide-react';
import { MAJOR_KEYS, MINOR_KEYS } from '../constants';

interface LyricsPanelProps {
  headerValue: string;
  bodyValue: string;
  onChange: (headerVal: string, bodyVal: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onTranspose: (steps: number) => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  headerValue, bodyValue, onChange, onFocus, onBlur, onTranspose
}) => {
  // Parse headerValue
  const lines = headerValue.split('\n');
  let title = '';
  let subtitle = '';
  let songKey = '';
  const otherLines: string[] = [];

  for (const line of lines) {
    const match = line.trim().match(/^\{([^:]+):(.*)\}$/);
    if (match) {
      const k = match[1].trim().toLowerCase();
      const v = match[2].trim();
      if (k === 'title') { title = v; continue; }
      if (k === 'subtitle') { subtitle = v; continue; }
      if (k === 'key') { songKey = v; continue; }
    }
    otherLines.push(line);
  }
  const otherText = otherLines.join('\n');

  const updateHeader = (newTitle: string, newSubtitle: string, newKey: string, newOther: string) => {
    const parts = [];
    if (newTitle) parts.push(`{title:${newTitle}}`);
    if (newSubtitle) parts.push(`{subtitle:${newSubtitle}}`);
    if (newKey) parts.push(`{key:${newKey}}`);
    if (newOther) parts.push(newOther);
    onChange(parts.join('\n'), bodyValue);
  };

  return (
    <div className="lyrics-panel flex flex-col h-full">
      <div className="panel-header shrink-0">
        <Settings2 className="w-4 h-4 text-amber-400" />
        <span>Header Input</span>
      </div>
      
      <div className="p-3 border-b border-[var(--border)] flex flex-col gap-3 shrink-0 overflow-y-auto bg-[var(--bg-base)] text-[var(--text-1)]">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[var(--text-3)] mb-1">Title</label>
            <input
              type="text"
              className="w-full border border-[var(--border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-1)]"
              value={title}
              onChange={e => updateHeader(e.target.value, subtitle, songKey, otherText)}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Song Title"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-bold text-[var(--text-3)] mb-1 flex justify-between">
              <span>Key</span>
              <span className="text-[10px] font-normal text-[var(--text-3)] opacity-80">移調(Transpose)</span>
            </label>
            <div className="flex items-center gap-1">
              <select
                className="flex-1 border border-[var(--border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-1)]"
                value={songKey}
                onChange={e => updateHeader(title, subtitle, e.target.value, otherText)}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                <option value="">None</option>
                <optgroup label="Major">
                  {MAJOR_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </optgroup>
                <optgroup label="Minor">
                  {MINOR_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </optgroup>
              </select>
              <button 
                onClick={() => onTranspose(-1)}
                className="px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] text-sm font-bold leading-none text-[var(--text-1)]"
                title="Transpose Down (-1)"
              >-</button>
              <button 
                onClick={() => onTranspose(1)}
                className="px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] text-sm font-bold leading-none text-[var(--text-1)]"
                title="Transpose Up (+1)"
              >+</button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-3)] mb-1">Subtitle</label>
          <input
            type="text"
            className="w-full border border-[var(--border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-1)]"
            value={subtitle}
            onChange={e => updateHeader(title, e.target.value, songKey, otherText)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Artist, Composer, etc."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-3)] mb-1">Comments & Other</label>
          <textarea
            className="w-full border border-[var(--border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-1)] resize-y"
            rows={3}
            value={otherText}
            onChange={e => updateHeader(title, subtitle, songKey, e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="{c:BPM=100} etc."
            spellCheck={false}
          />
        </div>
      </div>

      <div className="panel-header shrink-0">
        <AlignLeft className="w-4 h-4 text-amber-400" />
        <span>Lyrics Input</span>
      </div>
      <textarea
        className="lyrics-textarea flex-1 min-h-0"
        value={bodyValue}
        onChange={e => onChange(headerValue, e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Paste or type your lyrics here…&#10;&#10;Chords will appear in the Visual Editor →"
        spellCheck={false}
      />
    </div>
  );
};
