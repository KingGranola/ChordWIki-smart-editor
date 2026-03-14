import React from 'react';
import { X, HelpCircle, Type, MousePointerClick, Edit3, Music, FileDown } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <HelpCircle className="w-5 h-5 text-accent" />
            使い方ガイド (Help)
          </h2>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="modal-body p-6 bg-[var(--bg-base)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. 歌詞の入力 */}
            <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-sm flex gap-4">
              <div className="bg-[var(--accent-dim)] text-[var(--accent)] p-3 rounded-xl h-fit shrink-0">
                <Type className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-1)] mb-2">1. 歌詞の入力</h3>
                <p className="text-[var(--text-2)] text-sm leading-relaxed">
                  左側の「Lyrics Input」に歌詞を貼り付けるか、直接入力してください。右側の「Visual Editor」に即座に反映されます。ヘッダー情報（タイトル、キーなど）も左上のパネルから編集できます。
                </p>
              </div>
            </div>

            {/* 2. コードの配置 */}
            <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-sm flex gap-4">
              <div className="bg-[var(--success)]/20 text-[var(--success)] p-3 rounded-xl h-fit shrink-0">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-1)] mb-2">2. コードの配置</h3>
                <p className="text-[var(--text-2)] text-sm leading-relaxed">
                  上部の「Chord Palette」からコードをドラッグし、右側の歌詞の好きな文字の上にドロップすることでコードを配置できます。配置済みのコードもドラッグして左右に移動させることが可能です。
                </p>
              </div>
            </div>

            {/* 3. コードの直接編集 */}
            <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-sm flex gap-4">
              <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl h-fit shrink-0">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-1)] mb-2">3. コードの直接編集</h3>
                <p className="text-[var(--text-2)] text-sm leading-relaxed">
                  歌詞の文字をクリックすると、その位置に新しいコードを直接入力するためのポップアップが表示されます。また、すでに配置されているコードをクリックすると、コード名を変更したり削除したりできます。
                </p>
              </div>
            </div>

            {/* 4. キー設定と移調 */}
            <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-sm flex gap-4">
              <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl h-fit shrink-0">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-1)] mb-2">4. キー設定と移調</h3>
                <p className="text-[var(--text-2)] text-sm leading-relaxed">
                  左上の「Header Input」で曲のKeyを設定すると、Chord PaletteにそのKeyに合ったコード群が自動的に表示されます。Keyの横にある「-」「+」ボタンを使うと、曲全体のコードを一括して移調できます。
                </p>
              </div>
            </div>

            {/* 5. インポートとエクスポート */}
            <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-sm flex gap-4 md:col-span-2">
              <div className="bg-indigo-500/20 text-indigo-400 p-3 rounded-xl h-fit shrink-0">
                <FileDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-1)] mb-2">5. インポートとエクスポート</h3>
                <p className="text-[var(--text-2)] text-sm leading-relaxed">
                  ヘッダーの「Import」から既存のChordWiki形式のテキストを読み込めます。「Export」で作成したコード譜をテキストとして出力し、保存・共有できます。「Clear」ボタンで初期状態に戻すことも可能です。
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
