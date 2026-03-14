import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ImportModalProps {
  onImport: (text: string) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [text, setText] = useState('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Upload className="w-4 h-4 text-amber-400" /> Import ChordWiki
          </h2>
          <button onClick={onClose} className="icon-btn"><X className="w-4 h-4" /></button>
        </div>

        <div className="modal-body">
          <p className="modal-hint">Paste your ChordWiki format text below:</p>
          <textarea
            autoFocus
            className="import-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="{title:Song Name}&#10;[C]Lyrics go [G]here..."
            spellCheck={false}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={() => onImport(text)}
            disabled={!text.trim()}
            className="btn-primary"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};
