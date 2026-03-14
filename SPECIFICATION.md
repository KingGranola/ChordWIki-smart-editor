# ChordWiki Editor 詳細仕様書 (Specification)

本ドキュメントは、他のAIエージェントや開発者が本プロジェクトのコードベースを理解し、機能追加や改修をスムーズに行えるようにするための詳細な技術仕様書です。

## 1. データモデル (Data Models)

アプリケーションのコアとなる状態は `SongData` インターフェースで定義されています（`src/utils/chordwiki.ts`）。

\`\`\`typescript
export interface ChordMark {
  id: string;       // 一意のID (UUID等)
  chord: string;    // コードネーム (例: "C", "F#m7")
  position: number; // 歌詞文字列におけるインデックス位置 (0始まり)
}

export interface Line {
  id: string;       // 行の一意のID
  text: string;     // 歌詞のテキスト (コードを含まない純粋な文字列)
  chords: ChordMark[]; // この行に紐づくコードの配列
}

export interface SongData {
  meta: {
    title: string;
    subtitle: string;
    key: string;
    comment: string;
  };
  lines: Line[];
}
\`\`\`

## 2. コアロジック (`src/utils/chordwiki.ts`)

### パース処理 (`parseChordWiki`)
- **入力**: ChordWiki形式の文字列
- **処理**: 
  - `{key:value}` 形式のメタデータを抽出。
  - 各行を走査し、`[Chord]` 形式の文字列を抽出して `ChordMark` オブジェクトを生成。
  - コードタグを除去した純粋な歌詞を `Line.text` として保存。
- **出力**: `SongData` オブジェクト

### シリアライズ処理 (`serializeChordWiki`)
- **入力**: `SongData` オブジェクト
- **処理**:
  - メタデータを `{key:value}` 形式で先頭に出力。
  - 各行の `text` に対して、`chords` の `position` に基づいて `[Chord]` を挿入。
  - **重要**: `position` が `text.length` を超えている場合（歌詞の右側の空白部分にコードが置かれている場合）、不足分のスペース(` `)を自動的に補完して出力する。

### トランスポーズ処理 (`transposeChord`)
- 正規表現 `/[A-G][#b]?/g` を用いてコードネームからルート音を抽出。
- `NOTES` (シャープ系) と `FLAT_NOTES` (フラット系) の配列を用いて、現在の音がどちらの表記かを判定。
- 指定された半音数(`steps`)だけインデックスをシフト。元の表記がフラット系ならフラット系で、シャープ系ならシャープ系で新しい音を返す。

## 3. UIとレンダリングロジック (`src/App.tsx`)

### 状態管理
- `useHistory<SongData>` カスタムフックを使用して、`state` (現在のSongData) と履歴管理(`undo`, `redo`)を提供。
- `lyricsInput`: 左ペインのテキストエリア用のローカルステート。
- `editingChord`: 現在編集中のコードのポップアップを管理するステート。

### Visual Editorのレンダリング (`buildSegments` 関数)
実際のChordWikiサイトの表示（コードの文字幅が下の歌詞を押し出す）を再現するための重要な関数です。

- **課題**: 単純に文字の上に絶対配置(`position: absolute`)でコードを置くと、長いコードが連続した際にコード同士が重なってしまう。
- **解決策**: 行のテキストとコードを「セグメント」という単位に分割し、Flexboxで横に並べる。
  - 1文字ごとに走査し、コードが存在する位置で新しいセグメントを開始。
  - 各セグメントは「上部のコード群」と「下部の文字群」を持つ縦並びのFlexコンテナとなる。
  - これにより、上部のコード文字列が長い場合、Flexコンテナ自体の幅が広がり、後続の文字やコードが自然に右に押し出される。
- **パディング**: 歌詞の末尾より右側にコードをドロップできるよう、実際のテキスト長＋30文字分のダミー文字（透明な `_`）をレンダリング時に追加している。

### ドラッグ＆ドロップ実装
- **Drag Start**: コード要素の `onDragStart` にて、`e.dataTransfer.setData` で JSON文字列 `{ type: 'existing' | 'new', chordId?: string, chord?: string, lineId?: string }` をセット。
- **Drag Over**: ドロップ先の文字要素（`<span>`）の `onDragOver` で `e.preventDefault()` を呼び出し、ドロップを許可。
- **Drop**: `onDrop` イベントハンドラ (`handleDropChord`) にてデータをパース。
  - 新規追加 (`type === 'new'`): パレットからの追加。新しいIDを生成して `chords` 配列に追加。
  - 移動 (`type === 'existing'`): 既存コードの移動。対象のコードを配列から探し、`position` と所属する `lineId` を更新。

## 4. 今後の拡張に向けた留意点
- **パフォーマンス**: 現在は状態が更新されるたびに全行の `buildSegments` が再計算されます。行数が非常に多い曲の場合、React.memo や useMemo を用いた行単位のレンダリング最適化が必要になる可能性があります。
- **モバイル対応**: 現在はドラッグ＆ドロップ API (HTML5) を使用しているため、スマートフォン等のタッチデバイスではコードの移動が機能しません。モバイル対応を行う場合は、`react-beautiful-dnd` や `@dnd-kit/core` などのタッチ対応ライブラリの導入、またはタップベースの移動UIへの改修が必要です。
- **コードのパース強化**: 現在のトランスポーズ機能はオンコード（分数コード、例: `C/E`）のベース音の移調にも対応していますが、より複雑なテンション表記の正規化などは行っていません。
