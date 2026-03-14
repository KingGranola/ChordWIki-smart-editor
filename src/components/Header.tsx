import React from 'react';
import { Undo2, Redo2, Music2, Upload, Download, HelpCircle, Trash2 } from 'lucide-react';

interface HeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  onExport: () => void;
  onHelp: () => void;
  onClear: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  canUndo, canRedo, onUndo, onRedo, onImport, onExport, onHelp, onClear
}) => (
  <header className="header-bar">
    <div className="flex items-center gap-2 flex-1">
      <button onClick={onHelp} className="btn-header" title="Help">
        <HelpCircle className="w-4 h-4" /> Help
      </button>
      <button onClick={onImport} className="btn-header" title="Import ChordWiki text">
        <Upload className="w-4 h-4" /> Import
      </button>
      <button onClick={onExport} className="btn-accent" title="Export ChordWiki text">
        <Download className="w-4 h-4" /> Export
      </button>
      <button onClick={onClear} className="btn-header text-[var(--danger)] hover:bg-[var(--danger-dim)] hover:text-[var(--danger)] border-[var(--danger)]" title="Reset to default">
        <Trash2 className="w-4 h-4" /> Clear
      </button>
    </div>

    <h1 className="app-title">
      <Music2 className="w-5 h-5 text-amber-400" />
      ChordWiki smart editor <span className="text-xs opacity-60 ml-1 font-normal">v0.5</span>
    </h1>

    <div className="flex gap-1 flex-1 justify-end items-center">
      <span className="shortcut-hint hidden md:block">
        <kbd>Ctrl Z</kbd> / <kbd>Ctrl Y</kbd>
      </span>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="icon-btn"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="icon-btn"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  </header>
);
