export interface ChordMark {
  id: string;
  position: number;
  chord: string;
}

export interface Line {
  id: string;
  type?: 'lyric' | 'c' | 'ci';
  text: string;
  chords: ChordMark[];
}

export interface MetaData {
  title: string;
  subtitle: string;
  key: string;
  comment?: string;
}

export interface SongData {
  meta: MetaData;
  headerLines: Line[];
  lines: Line[];
}

export interface Segment {
  startPosition: number;
  chords: ChordMark[];
  chars: { char: string; position: number; isPadding: boolean }[];
}

export interface EditingChord {
  lineId: string;
  position: number;
  chordId?: string;
  initialValue: string;
}
