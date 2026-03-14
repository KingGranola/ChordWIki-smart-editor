import { useMemo } from 'react';
import { Line, ChordMark, Segment } from '../types';

export function useSegments(line: Line): Segment[] {
  return useMemo(() => {
    const segments: Segment[] = [];
    const textLen = line.text.length;
    const chords = [...line.chords].sort((a, b) => a.position - b.position);

    // Group chords by position
    const chordsByPos = new Map<number, ChordMark[]>();
    for (const c of chords) {
      const arr = chordsByPos.get(c.position) || [];
      arr.push(c);
      chordsByPos.set(c.position, arr);
    }

    // Positions that need a segment start
    const positions = new Set<number>([0]);
    for (const c of chords) {
      positions.add(c.position);
    }

    const sortedPositions = Array.from(positions).sort((a, b) => a - b);
    const maxPos = sortedPositions.length > 0 ? Math.max(textLen, sortedPositions[sortedPositions.length - 1]) : textLen;

    for (let i = 0; i < sortedPositions.length; i++) {
      const start = sortedPositions[i];
      const end = i < sortedPositions.length - 1 ? sortedPositions[i + 1] : maxPos;
      
      const segChords = chordsByPos.get(start) || [];
      const chars = [];

      for (let p = start; p < end; p++) {
        chars.push({
          position: p,
          char: p < textLen ? line.text[p] : ' ',
          isPadding: p >= textLen
        });
      }

      // If segment has chords but no chars, add a padding char
      if (chars.length === 0 && segChords.length > 0) {
        chars.push({
          position: start,
          char: ' ',
          isPadding: true
        });
      }

      if (chars.length > 0 || segChords.length > 0) {
        segments.push({
          startPosition: start,
          chords: segChords,
          chars
        });
      }
    }

    // If completely empty line, still need one empty segment to drop chords on
    if (segments.length === 0) {
      segments.push({
        startPosition: 0,
        chords: [],
        chars: [{ position: 0, char: ' ', isPadding: true }]
      });
    }

    return segments;
  }, [line]);
}
