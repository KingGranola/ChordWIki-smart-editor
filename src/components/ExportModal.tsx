import React, { useState } from 'react';
import { Download, X, Copy, Check } from 'lucide-react';
import { SongData } from '../types';
import { serializeChordWiki } from '../utils/chordwiki';

interface ExportModalProps {
  state: SongData;
  onClose: () => void;
}

function tokenize(line: string) {
  return line.split(/(\{[^}]+\}|\[[^\]]+\])/g);
}

export const ExportModal: React.FC<ExportModalProps> = ({ state, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const { headerText, bodyText } = serializeChordWiki(state);
  const text = headerText + (headerText && bodyText ? '\n\n' : '') + bodyText;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.meta.title || 'song'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel modal-panel-dark" onClick={e => e.stopPropagation()}>
        <div className="modal-header modal-header-dark">
          <h2 className="modal-title">
            <Download className="w-4 h-4 text-amber-400" /> Export ChordWiki
          </h2>
          <button onClick={onClose} className="icon-btn"><X className="w-4 h-4" /></button>
        </div>

        <div className="export-preview">
          {text.split('\n').map((line, i) => (
            <div key={i} className="min-h-[1.5em]">
              {tokenize(line).map((token, j) => {
                if (token.startsWith('{') && token.endsWith('}'))
                  return <span key={j} className="token-meta">{token}</span>;
                if (token.startsWith('[') && token.endsWith(']'))
                  return <span key={j} className="token-chord">{token}</span>;
                return <span key={j} className="token-text">{token}</span>;
              })}
            </div>
          ))}
        </div>

        <div className="modal-footer modal-footer-dark">
          <button onClick={handleDownload} className="btn-ghost-light">
            <Download className="w-4 h-4" /> Download .txt
          </button>
          <button onClick={handleCopy} className="btn-primary">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
};
