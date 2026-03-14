import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { SongData, EditingChord, Line } from './types';
import { parseChordWiki, transposeChord, generateId, serializeChordWiki, splitImportText, serializeToPlainText } from './utils/chordwiki';
import { useHistory } from './hooks/useHistory';
import { INITIAL_TEXT } from './constants';
import { VoicingMode, getChordVoicing } from './utils/voicing';
import { initAudio, playNotes, stopAudio } from './utils/audio';
import * as Tone from 'tone';

import { Header } from './components/Header';
import { LyricsPanel } from './components/LyricsPanel';
import { ChordPalette } from './components/ChordPalette';
import { PlaybackPanel } from './components/PlaybackPanel';
import { LineRow } from './components/LineRow';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { LoadingModal } from './components/LoadingModal';

// ---------------------------------------------------------------------------

export default function App() {
  const { state, updateState, undo, redo, canUndo, canRedo } = useHistory<SongData>(() => {
    const { headerText, bodyText } = splitImportText(INITIAL_TEXT);
    return parseChordWiki(headerText, bodyText);
  });

  const [isTyping, setIsTyping] = useState(false);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editingChord, setEditingChord] = useState<EditingChord | null>(null);
  const [dragOver, setDragOver] = useState<{ lineId: string; position: number } | null>(null);
  const [dragItem, setDragItem] = useState<{ chord: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Playback state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [voicingMode, setVoicingMode] = useState<VoicingMode>('Shell');
  const [playingChordId, setPlayingChordId] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  const prevNotesRef = useRef<number[] | null>(null);
  const clearPlayingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [localHeader, setLocalHeader] = useState('');
  const [localBody, setLocalBody] = useState('');

  const { headerText } = serializeChordWiki(state);
  const bodyText = serializeToPlainText(state);

  useEffect(() => {
    if (!isTyping) {
      setLocalHeader(headerText);
      setLocalBody(bodyText);
    }
  }, [headerText, bodyText, isTyping]);

  const handleClear = useCallback(() => {
    const { headerText, bodyText } = splitImportText(INITIAL_TEXT);
    const newState = parseChordWiki(headerText, bodyText);
    updateState(newState);
    setLocalHeader(headerText);
    setLocalBody(bodyText);
    setShowClearConfirm(false);
  }, [updateState]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      }
      if (e.key === 'Escape') setEditingChord(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---- Playback Logic ------------------------------------------------------

  const handleInitAudio = useCallback(async () => {
    if (isAudioReady) return;
    setIsAudioLoading(true);
    try {
      await initAudio();
      setIsAudioReady(true);
    } catch (err) {
      console.error("Failed to init audio", err);
    } finally {
      setIsAudioLoading(false);
    }
  }, [isAudioReady]);

  const playChord = useCallback(async (chordName: string, chordId: string, autoPlay: boolean = false) => {
    if (!isAudioReady) {
      await handleInitAudio();
    }
    setPlayingChordId(chordId);
    const notes = getChordVoicing(chordName, voicingMode, prevNotesRef.current);
    prevNotesRef.current = notes;
    playNotes(notes, "2n");

    if (clearPlayingTimeoutRef.current) {
      clearTimeout(clearPlayingTimeoutRef.current);
    }
    
    if (!autoPlay) {
      clearPlayingTimeoutRef.current = setTimeout(() => {
        setPlayingChordId(null);
      }, 500);
    }
  }, [voicingMode, isAudioReady, handleInitAudio]);

  const getAllChords = useCallback(() => {
    const allChords: { id: string, chord: string }[] = [];
    state.headerLines.forEach(line => {
      if (!line.type || line.type === 'lyric') {
        allChords.push(...[...line.chords].sort((a, b) => a.position - b.position));
      }
    });
    state.lines.forEach(line => {
      if (!line.type || line.type === 'lyric') {
        allChords.push(...[...line.chords].sort((a, b) => a.position - b.position));
      }
    });
    return allChords;
  }, [state]);

  useEffect(() => {
    let part: Tone.Part | null = null;
    let isCancelled = false;

    const startPlayback = async () => {
      if (!isAudioReady) {
        await handleInitAudio();
      }
      
      if (isCancelled) return;

      const chords = getAllChords();
      if (chords.length === 0) {
        setIsPlaying(false);
        return;
      }
      
      Tone.Transport.bpm.value = bpm;
      prevNotesRef.current = null; // Reset voice leading
      
      const events = chords.map((c, i) => {
        const time = i * (60 / bpm) * 2; // 2 beats per chord
        return { time, chordObj: c };
      });

      part = new Tone.Part((time, value) => {
        const { chordObj } = value;
        const notes = getChordVoicing(chordObj.chord, voicingMode, prevNotesRef.current);
        prevNotesRef.current = notes;
        
        playNotes(notes, "2n", time);
        
        Tone.Draw.schedule(() => {
          setPlayingChordId(chordObj.id);
        }, time);
      }, events).start(0);

      const totalTime = chords.length * (60 / bpm) * 2;
      
      Tone.Transport.schedule(() => {
        Tone.Draw.schedule(() => {
          setIsPlaying(false);
          setPlayingChordId(null);
        }, Tone.now());
      }, totalTime);

      Tone.Transport.start();
    };

    if (isPlaying) {
      startPlayback();
    } else {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (part) {
        part.dispose();
      }
      setPlayingChordId(null);
      stopAudio();
    }
    
    return () => {
      isCancelled = true;
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (part) {
        part.dispose();
      }
    };
  }, [isPlaying, bpm, getAllChords, voicingMode, isAudioReady, handleInitAudio]);

  const handleTogglePreview = useCallback(() => {
    const newMode = !isPreviewMode;
    setIsPreviewMode(newMode);
    setIsPlaying(false);
    setEditingChord(null);
    if (newMode) {
      handleInitAudio();
    }
  }, [isPreviewMode, handleInitAudio]);

  // ---- Handlers ------------------------------------------------------------

  const handleLyricsChange = useCallback((newHeader: string, newBody: string) => {
    setLocalHeader(newHeader);
    setLocalBody(newBody);
    const parsed = parseChordWiki(newHeader, newBody);
    
    const mergedLines = parsed.lines.map((newLine, i) => {
      const oldLine = state.lines[i];
      if (oldLine && oldLine.type === newLine.type) {
        const mergedChords = [...newLine.chords];
        if (mergedChords.length === 0) {
          mergedChords.push(...oldLine.chords);
        }
        return { ...newLine, chords: mergedChords.filter(c => c.position <= newLine.text.length) };
      }
      return newLine;
    });

    updateState({ ...parsed, lines: mergedLines });
  }, [state, updateState]);

  const handleTranspose = useCallback((steps: number) => {
    const transposeLine = (l: Line) => ({
      ...l,
      chords: l.chords.map(c => ({ ...c, chord: transposeChord(c.chord, steps) }))
    });
    
    const newData = {
      ...state,
      meta: {
        ...state.meta,
        key: state.meta.key ? transposeChord(state.meta.key, steps) : state.meta.key
      },
      headerLines: state.headerLines.map(transposeLine),
      lines: state.lines.map(transposeLine)
    };
    updateState(newData);
  }, [state, updateState]);

  const updateLine = useCallback((id: string, updater: (line: Line) => Line) => {
    let found = false;
    const newHeaderLines = state.headerLines.map(l => {
      if (l.id === id) { found = true; return updater(l); }
      return l;
    });
    const newLines = state.lines.map(l => {
      if (l.id === id) { found = true; return updater(l); }
      return l;
    });
    
    if (found) {
      updateState({ ...state, headerLines: newHeaderLines, lines: newLines });
    }
  }, [state, updateState]);

  const handleLineTextChange = useCallback((lineId: string, text: string) => {
    updateLine(lineId, l => ({ ...l, text }));
  }, [updateLine]);

  const handleDeleteLine = useCallback((id: string) => {
    updateState({
      ...state,
      headerLines: state.headerLines.filter(l => l.id !== id),
      lines: state.lines.filter(l => l.id !== id)
    });
  }, [state, updateState]);

  const handleSaveChord = useCallback((value: string) => {
    if (!editingChord) return;
    const { lineId, position, chordId } = editingChord;
    
    const updater = (line: Line) => {
      let chords = [...line.chords];
      if (value.trim() === '') {
        chords = chordId ? chords.filter(c => c.id !== chordId) : chords;
      } else if (chordId) {
        chords = chords.map(c => c.id === chordId ? { ...c, chord: value.trim() } : c);
      } else {
        const existing = chords.find(c => c.position === position);
        if (existing) {
          chords = chords.map(c => c.position === position ? { ...c, chord: value.trim() } : c);
        } else {
          chords = [...chords, { id: generateId(), position, chord: value.trim() }];
        }
      }
      return { ...line, chords };
    };

    updateLine(lineId, updater);
    setEditingChord(null);
  }, [editingChord, updateLine]);

  const handleDeleteChord = useCallback((chordId: string) => {
    if (!editingChord) return;
    const { lineId } = editingChord;
    updateLine(lineId, l => ({ ...l, chords: l.chords.filter(c => c.id !== chordId) }));
    setEditingChord(null);
  }, [editingChord, updateLine]);

  const handleDropChord = useCallback((
    e: React.DragEvent,
    targetLineId: string,
    targetPosition: number,
  ) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      let newData = { 
        ...state, 
        headerLines: state.headerLines.map(l => ({ ...l, chords: [...l.chords] })),
        lines: state.lines.map(l => ({ ...l, chords: [...l.chords] })) 
      };

      if (data.type === 'palette') {
        const targetLine = newData.headerLines.find(l => l.id === targetLineId) || newData.lines.find(l => l.id === targetLineId);
        if (!targetLine) return;
        const existing = targetLine.chords.find(c => c.position === targetPosition);
        if (existing) existing.chord = data.chord;
        else targetLine.chords.push({ id: generateId(), position: targetPosition, chord: data.chord });
        updateState(newData);
        if (data.chord === '?') {
          setEditingChord({ lineId: targetLineId, position: targetPosition, initialValue: '' });
        }
      } else if (data.type === 'existing') {
        const { lineId: srcId, chordId } = data;
        const srcLine = newData.headerLines.find(l => l.id === srcId) || newData.lines.find(l => l.id === srcId);
        const tgtLine = newData.headerLines.find(l => l.id === targetLineId) || newData.lines.find(l => l.id === targetLineId);
        if (!srcLine || !tgtLine) return;
        const idx = srcLine.chords.findIndex(c => c.id === chordId);
        if (idx !== -1) {
          const [chord] = srcLine.chords.splice(idx, 1);
          chord.position = targetPosition;
          
          // Remove any existing chord at the target position to avoid duplicates
          const existingTgtIdx = tgtLine.chords.findIndex(c => c.position === targetPosition);
          if (existingTgtIdx !== -1) {
            tgtLine.chords.splice(existingTgtIdx, 1);
          }
          
          tgtLine.chords.push(chord);
          updateState(newData);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  }, [state, updateState]);

  const handleImport = useCallback((text: string) => {
    const { headerText, bodyText } = splitImportText(text);
    const newData = parseChordWiki(headerText, bodyText);
    updateState(newData);
    setShowImport(false);
  }, [updateState]);

  // ---- Render --------------------------------------------------------------

  return (
    <div className="app-root" onClick={() => setEditingChord(null)}>
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        isPreviewMode={isPreviewMode}
        onTogglePreview={handleTogglePreview}
        onUndo={undo}
        onRedo={redo}
        onImport={() => setShowImport(true)}
        onExport={() => setShowExport(true)}
        onHelp={() => setShowHelp(true)}
        onClear={() => setShowClearConfirm(true)}
      />

      <div className="app-body">
        {!isPreviewMode && (
          <LyricsPanel
            headerValue={localHeader}
            bodyValue={localBody}
            onChange={handleLyricsChange}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            onTranspose={handleTranspose}
          />
        )}

        <div className="editor-panel">
          <div className="editor-scroll">
            {isPreviewMode ? (
              <PlaybackPanel
                isAudioReady={isAudioReady}
                isAudioLoading={isAudioLoading}
                onInitAudio={handleInitAudio}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onStop={() => setIsPlaying(false)}
                bpm={bpm}
                onBpmChange={setBpm}
                voicingMode={voicingMode}
                onVoicingModeChange={setVoicingMode}
              />
            ) : (
              <ChordPalette 
                songKey={state.meta.key} 
                onDragStartItem={setDragItem}
                onDragEndItem={() => setDragItem(null)}
              />
            )}

            <div className="lines-area font-sans">
              {state.meta.title && (
                <div className="text-right text-3xl font-bold mb-4">
                  {state.meta.title}
                </div>
              )}
              {state.meta.subtitle && (
                <div className="text-right text-sm font-bold mb-8">
                  {state.meta.subtitle}
                </div>
              )}

              {state.headerLines.map((line) => {
                return (
                  <React.Fragment key={line.id}>
                    {line.type === 'c' && (
                      <div className="font-bold text-base mb-4">
                        {line.text}
                      </div>
                    )}
                    
                    {line.type === 'ci' && (
                      <div className="font-bold italic text-base mb-4">
                        {line.text}
                      </div>
                    )}
                    
                    {(!line.type || line.type === 'lyric') && (
                      <LineRow
                        line={line}
                        songKey={state.meta.key}
                        isEditing={editingLine === line.id}
                        editingChord={editingChord}
                        dragOver={dragOver}
                        dragItem={dragItem}
                        isPreviewMode={isPreviewMode}
                        playingChordId={playingChordId}
                        onDragStartItem={setDragItem}
                        onDragEndItem={() => setDragItem(null)}
                        onEditLine={() => setEditingLine(line.id)}
                        onDeleteLine={() => handleDeleteLine(line.id)}
                        onLineTextChange={text => handleLineTextChange(line.id, text)}
                        onLineEditBlur={() => setEditingLine(null)}
                        onLineEditKeyDown={e => { if (e.key === 'Enter') setEditingLine(null); }}
                        onClickChar={pos =>
                          setEditingChord({ lineId: line.id, position: pos, initialValue: '' })
                        }
                        onClickChord={(chordId, pos, chord) => {
                          if (isPreviewMode) {
                            playChord(chord, chordId, false);
                          } else {
                            setEditingChord({ lineId: line.id, position: pos, chordId, initialValue: chord });
                          }
                        }}
                        onDragOverChar={(lid, pos) => setDragOver({ lineId: lid, position: pos })}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={handleDropChord}
                        onSaveChord={handleSaveChord}
                        onDeleteChord={handleDeleteChord}
                        onCloseChord={() => setEditingChord(null)}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {state.meta.key && (
                <div className="text-[var(--danger)] font-bold text-base mb-4">
                  Key: {state.meta.key}
                </div>
              )}

              {state.lines.map((line) => {
                return (
                  <React.Fragment key={line.id}>
                    {line.type === 'c' && (
                      <div className="font-bold text-base mb-4">
                        {line.text}
                      </div>
                    )}
                    
                    {line.type === 'ci' && (
                      <div className="font-bold italic text-base mb-4">
                        {line.text}
                      </div>
                    )}
                    
                    {(!line.type || line.type === 'lyric') && (
                      <LineRow
                        line={line}
                        songKey={state.meta.key}
                        isEditing={editingLine === line.id}
                        editingChord={editingChord}
                        dragOver={dragOver}
                        dragItem={dragItem}
                        isPreviewMode={isPreviewMode}
                        playingChordId={playingChordId}
                        onDragStartItem={setDragItem}
                        onDragEndItem={() => setDragItem(null)}
                        onEditLine={() => setEditingLine(line.id)}
                        onDeleteLine={() => handleDeleteLine(line.id)}
                        onLineTextChange={text => handleLineTextChange(line.id, text)}
                        onLineEditBlur={() => setEditingLine(null)}
                        onLineEditKeyDown={e => { if (e.key === 'Enter') setEditingLine(null); }}
                        onClickChar={pos =>
                          setEditingChord({ lineId: line.id, position: pos, initialValue: '' })
                        }
                        onClickChord={(chordId, pos, chord) => {
                          if (isPreviewMode) {
                            playChord(chord, chordId, false);
                          } else {
                            setEditingChord({ lineId: line.id, position: pos, chordId, initialValue: chord });
                          }
                        }}
                        onDragOverChar={(lid, pos) => setDragOver({ lineId: lid, position: pos })}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={handleDropChord}
                        onSaveChord={handleSaveChord}
                        onDeleteChord={handleDeleteChord}
                        onCloseChord={() => setEditingChord(null)}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {showImport && (
          <ImportModal
            onImport={handleImport}
            onClose={() => setShowImport(false)}
          />
        )}

        {showExport && (
          <ExportModal
            state={state}
            onClose={() => setShowExport(false)}
          />
        )}

        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}

        {showClearConfirm && (
          <div className="modal-backdrop" onClick={() => setShowClearConfirm(false)}>
            <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title text-[var(--danger)]">データの初期化</h2>
              </div>
              <div className="modal-body">
                <p>すべてのデータを初期状態（ダミーデータ）に戻します。よろしいですか？</p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowClearConfirm(false)} className="btn-ghost">キャンセル</button>
                <button onClick={handleClear} className="btn-primary bg-[var(--danger)] border-[var(--danger)] hover:bg-red-600 text-white">初期化する</button>
              </div>
            </div>
          </div>
        )}

        <LoadingModal isOpen={isAudioLoading} />
      </div>
    </div>
  );
}
