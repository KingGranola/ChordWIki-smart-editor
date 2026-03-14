import { MetaData, ChordMark, Line, SongData } from '../types';
import { NOTES, FLAT_NOTES } from '../constants';

export { NOTES, FLAT_NOTES };

export const generateId = (): string => Math.random().toString(36).substring(2, 11);

export function isChordLine(line: string): boolean {
  const cleanLine = line.replace(/[|\s()]/g, '');
  if (cleanLine.length === 0) return false;

  const tokens = line.split(/[\s|()]+/).filter(t => t.length > 0);
  if (tokens.length === 0) return false;

  const chordRegex = /^([A-G][#b]?(m|M|maj|min|dim|aug|sus|add|[0-9])*(on[A-G][#b]?|\/[A-G][#b]?)?|N\.C\.|%)$/i;
  
  return tokens.every(t => chordRegex.test(t));
}

export function extractChordsFromLine(line: string): { position: number, chord: string }[] {
  const chords: { position: number, chord: string }[] = [];
  const regex = /([A-G][#b]?(?:m|M|maj|min|dim|aug|sus|add|[0-9])*(?:on[A-G][#b]?|\/[A-G][#b]?)?|N\.C\.|%)/gi;
  let match;
  while ((match = regex.exec(line)) !== null) {
    chords.push({ position: match.index, chord: match[0] });
  }
  return chords;
}

export function parseLine(line: string): Line {
  let plainText = '';
  const chords: ChordMark[] = [];
  let isChord = false;
  let currentChord = '';

  for (const char of line) {
    if (char === '[') {
      isChord = true;
      currentChord = '';
    } else if (char === ']') {
      isChord = false;
      chords.push({ id: generateId(), position: plainText.length, chord: currentChord });
    } else if (isChord) {
      currentChord += char;
    } else {
      plainText += char;
    }
  }
  return { id: generateId(), text: plainText, chords };
}

export function parseChordWiki(headerText: string, bodyText: string): SongData {
  const meta: MetaData = { title: '', subtitle: '', key: '' };
  const headerLines: Line[] = [];
  const bodyLines: Line[] = [];

  const hLines = headerText ? headerText.split('\n') : [];
  for (const line of hLines) {
    const metaMatch = line.trim().match(/^\{([^:]+):(.*)\}$/);
    if (metaMatch) {
      const key = metaMatch[1].trim().toLowerCase();
      const value = metaMatch[2].trim();
      if (key === 'title') { meta.title = value; continue; }
      if (key === 'subtitle') { meta.subtitle = value; continue; }
      if (key === 'key') { meta.key = value; continue; }
      if (key === 'c' || key === 'comment') {
        headerLines.push({ id: generateId(), type: 'c', text: value, chords: [] });
        continue;
      }
      if (key === 'ci') {
        headerLines.push({ id: generateId(), type: 'ci', text: value, chords: [] });
        continue;
      }
    }
    headerLines.push(parseLine(line));
  }

  const bLines = bodyText ? bodyText.split('\n') : [];
  let pendingChords: { position: number, chord: string }[] = [];

  for (const line of bLines) {
    const metaMatch = line.trim().match(/^\{([^:]+):(.*)\}$/);
    if (metaMatch) {
      const key = metaMatch[1].trim().toLowerCase();
      const value = metaMatch[2].trim();
      if (key === 'c' || key === 'comment') {
        bodyLines.push({ id: generateId(), type: 'c', text: value, chords: [] });
        continue;
      }
      if (key === 'ci') {
        bodyLines.push({ id: generateId(), type: 'ci', text: value, chords: [] });
        continue;
      }
    }

    if (isChordLine(line)) {
      pendingChords.push(...extractChordsFromLine(line));
      continue;
    }

    const parsedLine = parseLine(line);
    
    for (const pc of pendingChords) {
      const pos = Math.min(pc.position, parsedLine.text.length);
      parsedLine.chords.push({ id: generateId(), position: pos, chord: pc.chord });
    }
    pendingChords = [];

    bodyLines.push(parsedLine);
  }

  if (pendingChords.length > 0) {
    const parsedLine: Line = { id: generateId(), text: '', chords: [] };
    for (const pc of pendingChords) {
      parsedLine.chords.push({ id: generateId(), position: 0, chord: pc.chord });
    }
    bodyLines.push(parsedLine);
  }

  return { meta, headerLines, lines: bodyLines };
}

export function serializeLine(line: Line): string {
  let lineStr = '';
  const sortedChords = [...line.chords].sort((a, b) => a.position - b.position);
  let chordIndex = 0;
  const maxPos = sortedChords.length > 0
    ? Math.max(line.text.length, ...sortedChords.map(c => c.position))
    : line.text.length;

  for (let i = 0; i <= maxPos; i++) {
    while (chordIndex < sortedChords.length && sortedChords[chordIndex].position === i) {
      lineStr += `[${sortedChords[chordIndex].chord}]`;
      chordIndex++;
    }
    if (i < line.text.length) lineStr += line.text[i];
    else if (i < maxPos) lineStr += ' ';
  }
  return lineStr;
}

export function serializeChordWiki(data: SongData): { headerText: string, bodyText: string } {
  const headerParts: string[] = [];
  if (data.meta.title) headerParts.push(`{title:${data.meta.title}}`);
  if (data.meta.subtitle) headerParts.push(`{subtitle:${data.meta.subtitle}}`);
  
  for (const line of data.headerLines) {
    if (line.type === 'c') headerParts.push(`{c:${line.text}}`);
    else if (line.type === 'ci') headerParts.push(`{ci:${line.text}}`);
    else headerParts.push(serializeLine(line));
  }
  
  if (data.meta.key) headerParts.push(`{key:${data.meta.key}}`);

  const bodyParts: string[] = [];
  for (const line of data.lines) {
    if (line.type === 'c') bodyParts.push(`{c:${line.text}}`);
    else if (line.type === 'ci') bodyParts.push(`{ci:${line.text}}`);
    else bodyParts.push(serializeLine(line));
  }

  return {
    headerText: headerParts.join('\n'),
    bodyText: bodyParts.join('\n')
  };
}

export function serializeToPlainText(data: SongData): string {
  return data.lines.map(l => {
    if (l.type === 'c') return `{c:${l.text}}`;
    if (l.type === 'ci') return `{ci:${l.text}}`;
    return l.text;
  }).join('\n');
}

export function splitImportText(text: string): { headerText: string, bodyText: string } {
  const lines = text.split('\n');
  const headerLines: string[] = [];
  const bodyLines: string[] = [];
  let inHeader = true;

  for (const line of lines) {
    if (inHeader) {
      if (line.trim() === '' || line.trim().match(/^\{.*\}$/)) {
        headerLines.push(line);
      } else {
        inHeader = false;
        bodyLines.push(line);
      }
    } else {
      bodyLines.push(line);
    }
  }

  while(headerLines.length > 0 && headerLines[headerLines.length - 1].trim() === '') {
    bodyLines.unshift(headerLines.pop()!);
  }

  return {
    headerText: headerLines.join('\n'),
    bodyText: bodyLines.join('\n')
  };
}

export function transposeChord(chord: string, steps: number): string {
  return chord.replace(/[A-G][#b]?/g, (match) => {
    let index = NOTES.indexOf(match);
    let isFlat = false;
    if (index === -1) {
      index = FLAT_NOTES.indexOf(match);
      if (index !== -1) isFlat = true;
    }
    if (index === -1) return match;
    const newIndex = ((index + steps) % 12 + 12) % 12;
    return isFlat ? FLAT_NOTES[newIndex] : NOTES[newIndex];
  });
}

export type ChordComplexity = 'triad' | '7th' | 'tension';

export interface PaletteChords {
  diatonic: string[];
  secondaryDominant: string[];
  subdominantMinor: string[];
  substituteDominant: string[];
}

export function getPaletteChords(key: string, complexity: ChordComplexity): PaletteChords {
  const defaultChords: PaletteChords = {
    diatonic: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    secondaryDominant: ['A', 'B', 'C', 'D', 'E'],
    subdominantMinor: ['Fm', 'Ddim', 'Ab', 'Bb'],
    substituteDominant: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb']
  };
  
  if (!key) return defaultChords;
  
  const match = key.match(/^([A-G][#b]?)(m?)$/i);
  if (!match) return defaultChords;
  
  const root = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  const isMinor = match[2].toLowerCase() === 'm';
  
  let rootIndex = NOTES.indexOf(root);
  let useFlats = false;
  if (rootIndex === -1) {
    rootIndex = FLAT_NOTES.indexOf(root);
    useFlats = true;
  }
  if (rootIndex === -1) return defaultChords;

  if (root === 'F' || root === 'Dm' || root === 'Bb' || root === 'Gm' || root === 'Eb' || root === 'Cm' || root === 'Ab' || root === 'Fm') {
    useFlats = true;
  }

  const notesArray = useFlats ? FLAT_NOTES : NOTES;
  const n = (interval: number) => notesArray[(rootIndex + interval) % 12];

  if (isMinor) {
    return {
      diatonic: 
        complexity === 'triad' ? [n(0)+'m', n(2)+'m(b5)', n(3), n(5)+'m', n(7)+'m', n(8), n(10)] :
        complexity === '7th' ? [n(0)+'m7', n(2)+'m7(b5)', n(3)+'M7', n(5)+'m7', n(7)+'m7', n(8)+'M7', n(10)+'7'] :
        [n(0)+'m9', n(2)+'m7(b5)', n(3)+'M9', n(5)+'m9', n(7)+'m9', n(8)+'M9', n(10)+'9'],
      secondaryDominant:
        complexity === 'triad' ? [n(10), n(0), n(2), n(3), n(5)] :
        complexity === '7th' ? [n(10)+'7', n(0)+'7', n(2)+'7', n(3)+'7', n(5)+'7'] :
        [n(10)+'7(9)', n(0)+'7(b9)', n(2)+'7(b9)', n(3)+'7(9)', n(5)+'7(9)'],
      subdominantMinor:
        complexity === 'triad' ? [n(5)+'m', n(2)+'m(b5)', n(8), n(10)] :
        complexity === '7th' ? [n(5)+'m7', n(2)+'m7(b5)', n(8)+'M7', n(10)+'7'] :
        [n(5)+'m9', n(2)+'m7(b5)', n(8)+'M9', n(10)+'9'],
      substituteDominant:
        complexity === 'triad' ? [n(1), n(3), n(5), n(6), n(8), n(10)] :
        complexity === '7th' ? [n(1)+'7', n(3)+'7', n(5)+'7', n(6)+'7', n(8)+'7', n(10)+'7'] :
        [n(1)+'7(#11)', n(3)+'7(#11)', n(5)+'7(#11)', n(6)+'7(#11)', n(8)+'7(#11)', n(10)+'7(#11)']
    };
  } else {
    return {
      diatonic: 
        complexity === 'triad' ? [n(0), n(2)+'m', n(4)+'m', n(5), n(7), n(9)+'m', n(11)+'m(b5)'] :
        complexity === '7th' ? [n(0)+'M7', n(2)+'m7', n(4)+'m7', n(5)+'M7', n(7)+'7', n(9)+'m7', n(11)+'m7(b5)'] :
        [n(0)+'M9', n(2)+'m9', n(4)+'m7', n(5)+'M9', n(7)+'9', n(9)+'m9', n(11)+'m7(b5)'],
      secondaryDominant:
        complexity === 'triad' ? [n(9), n(11), n(0), n(2), n(4)] :
        complexity === '7th' ? [n(9)+'7', n(11)+'7', n(0)+'7', n(2)+'7', n(4)+'7'] :
        [n(9)+'7(b9)', n(11)+'7(b9)', n(0)+'7(9)', n(2)+'7(9)', n(4)+'7(b9)'],
      subdominantMinor:
        complexity === 'triad' ? [n(5)+'m', n(2)+'m(b5)', n(8), n(10)] :
        complexity === '7th' ? [n(5)+'m7', n(2)+'m7(b5)', n(8)+'M7', n(10)+'7'] :
        [n(5)+'m9', n(2)+'m7(b5)', n(8)+'M9', n(10)+'9'],
      substituteDominant:
        complexity === 'triad' ? [n(1), n(3), n(5), n(6), n(8), n(10)] :
        complexity === '7th' ? [n(1)+'7', n(3)+'7', n(5)+'7', n(6)+'7', n(8)+'7', n(10)+'7'] :
        [n(1)+'7(#11)', n(3)+'7(#11)', n(5)+'7(#11)', n(6)+'7(#11)', n(8)+'7(#11)', n(10)+'7(#11)']
    };
  }
}

export function getDiatonicChords(key: string): string[] {
  return getPaletteChords(key, 'triad').diatonic;
}
