import React, { memo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Line, EditingChord } from '../types';
import { useSegments } from '../utils/segments';
import { ChordPopup } from './ChordPopup';

interface LineRowProps {
  line: Line;
  songKey: string;
  isEditing: boolean;
  editingChord: EditingChord | null;
  dragOver: { lineId: string; position: number } | null;
  dragItem: { chord: string } | null;
  onDragStartItem: (item: { chord: string }) => void;
  onDragEndItem: () => void;
  onEditLine: () => void;
  onDeleteLine: () => void;
  onLineTextChange: (text: string) => void;
  onLineEditBlur: () => void;
  onLineEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClickChar: (position: number) => void;
  onClickChord: (chordId: string, position: number, chord: string) => void;
  onDragOverChar: (lineId: string, position: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, lineId: string, position: number) => void;
  onSaveChord: (value: string) => void;
  onDeleteChord: (chordId: string) => void;
  onCloseChord: () => void;
}

export const LineRow: React.FC<LineRowProps> = memo(({
  line,
  songKey,
  isEditing,
  editingChord,
  dragOver,
  dragItem,
  onDragStartItem,
  onDragEndItem,
  onEditLine,
  onDeleteLine,
  onLineTextChange,
  onLineEditBlur,
  onLineEditKeyDown,
  onClickChar,
  onClickChord,
  onDragOverChar,
  onDragLeave,
  onDrop,
  onSaveChord,
  onDeleteChord,
  onCloseChord,
}) => {
  const segments = useSegments(line);

  return (
    <div className="line-row group">
      {/* Line action buttons (visible on hover) */}
      <div className="line-actions">
        <button
          onClick={onEditLine}
          className="line-action-btn"
          title="Edit lyrics"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={onDeleteLine}
          className="line-action-btn line-action-btn-danger"
          title="Delete line"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {isEditing ? (
        <div className="pt-[1.2em]">
          <input
            autoFocus
            className="line-edit-input"
            value={line.text}
            onChange={e => onLineTextChange(e.target.value)}
            onBlur={onLineEditBlur}
            onKeyDown={onLineEditKeyDown}
            placeholder="Type lyrics…"
          />
        </div>
      ) : (
        <div className="relative flex flex-wrap pt-[1.2em] lyrics-line">
          {segments.map(seg => (
            <div key={seg.startPosition} className="flex flex-col items-start">
              {/* Chord row */}
              <div className="flex min-h-[1.4em]">
                {seg.chords.map(chord => (
                  <div
                    key={chord.id}
                    draggable
                    onDragStart={e => {
                      e.currentTarget.classList.add('opacity-50');
                      e.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({ type: 'existing', lineId: line.id, chordId: chord.id }),
                      );
                      onDragStartItem({ chord: chord.chord });
                    }}
                    onDragEnd={e => {
                      e.currentTarget.classList.remove('opacity-50');
                      onDragEndItem();
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDragOverChar(line.id, chord.position);
                    }}
                    onDragLeave={e => {
                      e.stopPropagation();
                      onDragLeave();
                    }}
                    onDrop={e => {
                      e.stopPropagation();
                      onDrop(e, line.id, chord.position);
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      onClickChord(chord.id, chord.position, chord.chord);
                    }}
                    className="chord-label relative z-10"
                  >
                    {chord.chord}

                    {/* Popup for editing an existing chord */}
                    {editingChord?.chordId === chord.id && (
                      <div className="chord-popup-anchor">
                        <ChordPopup
                          songKey={songKey}
                          initialValue={editingChord.initialValue}
                          showDelete
                          onSave={onSaveChord}
                          onDelete={() => onDeleteChord(chord.id)}
                          onClose={onCloseChord}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {seg.chords.length === 0 && <div className="min-h-[1.4em] w-0"></div>}
              </div>

              {/* Character row */}
              <div className="flex">
                {seg.chars.map(c => {
                  const isDropTarget =
                    dragOver?.lineId === line.id && dragOver?.position === c.position;
                  const hasNewChordPopup =
                    editingChord &&
                    !editingChord.chordId &&
                    editingChord.lineId === line.id &&
                    editingChord.position === c.position;

                  return (
                    <span
                      key={c.position}
                      className={[
                        'char-cell',
                        c.isPadding ? 'char-padding' : '',
                        isDropTarget ? 'char-drop-target' : '',
                      ].join(' ')}
                      onClick={() => onClickChar(c.position)}
                      onDragOver={e => { e.preventDefault(); onDragOverChar(line.id, c.position); }}
                      onDragLeave={onDragLeave}
                      onDrop={e => onDrop(e, line.id, c.position)}
                    >
                      {/* Invisible extension for drag over chord row */}
                      <span className="absolute -top-[1.4em] left-0 right-0 h-[1.4em] z-0" />
                      
                      <span className="relative z-10">{c.char === ' ' ? '\u00A0' : c.char}</span>

                      {isDropTarget && dragItem && (
                        <div className="absolute bottom-full left-0 mb-0 px-[1px] text-[16px] font-sans font-bold text-[var(--chord)] bg-[var(--chord-dim)] border-2 border-dashed border-[var(--chord)] rounded pointer-events-none z-50 animate-pulse whitespace-nowrap">
                          {dragItem.chord}
                        </div>
                      )}

                      {/* Popup for adding a new chord at this character */}
                      {hasNewChordPopup && (
                        <div className="chord-popup-above">
                          <ChordPopup
                            songKey={songKey}
                            initialValue={editingChord!.initialValue}
                            onSave={onSaveChord}
                            onClose={onCloseChord}
                          />
                        </div>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

LineRow.displayName = 'LineRow';
