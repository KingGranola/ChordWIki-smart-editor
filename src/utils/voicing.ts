import { Chord, Note, Interval } from '@tonaljs/tonal';

export type VoicingMode = 'Closed' | 'Shell' | 'Rootless' | 'Drop 2';

export const toMidi = (note: string) => Note.midi(note) || 60;
export const fromMidi = (midi: number) => Note.fromMidi(midi) || 'C4';

function normalizeChordName(name: string): string {
  let normalized = name.replace(/aug7\((b9|#9)\)/i, '7#5$1');
  normalized = normalized.replace(/aug7/i, '7#5');
  normalized = normalized.replace(/\+7\((b9|#9)\)/i, '7#5$1');
  normalized = normalized.replace(/m7\(b5\)/i, 'm7b5');
  
  // 13th chords
  normalized = normalized.replace(/M7\(13\)/, 'maj13');
  normalized = normalized.replace(/m7\(13\)/, 'm13');
  normalized = normalized.replace(/7\(13\)/, '13');
  
  // Other tensions
  normalized = normalized.replace(/7\((b9|#9|b13|#11)\)/i, '7$1');
  return normalized;
}

export function getBaseNotes(cleanName: string, mode: VoicingMode): number[] {
  const normalizedName = normalizeChordName(cleanName);
  let chord = Chord.get(normalizedName);
  
  // Fallback to original name if normalized version fails
  if (chord.empty) {
    chord = Chord.get(cleanName);
  }
  
  if (chord.empty) return [];

  const rootMidi = toMidi(chord.tonic + '3');
  const intervals = chord.intervals;
  
  const semitones = intervals.map(ivl => Interval.semitones(ivl) || 0);
  let notes = semitones.map(st => rootMidi + st);

  switch (mode) {
    case 'Shell': {
      const root = notes[0];
      const thirdIdx = intervals.findIndex(i => i.startsWith('3'));
      const seventhIdx = intervals.findIndex(i => i.startsWith('7'));
      
      const shellNotes = [root];
      if (seventhIdx !== -1) shellNotes.push(notes[seventhIdx]);
      
      if (thirdIdx !== -1) {
        shellNotes.push(notes[thirdIdx] + (seventhIdx !== -1 ? 12 : 0)); // 10th if 7th is present
      } else if (notes.length > 1) {
        shellNotes.push(notes[1] + 12);
      }
      
      return shellNotes.sort((a, b) => a - b);
    }

    case 'Rootless': {
      const thirdIdx = intervals.findIndex(i => i.startsWith('3'));
      const fifthIdx = intervals.findIndex(i => i.startsWith('5'));
      const seventhIdx = intervals.findIndex(i => i.startsWith('7'));
      const ninthIdx = intervals.findIndex(i => i.startsWith('9'));
      const eleventhIdx = intervals.findIndex(i => i.startsWith('11'));
      const thirteenthIdx = intervals.findIndex(i => i.startsWith('13'));
      
      const rootlessNotes = [];
      if (thirdIdx !== -1) rootlessNotes.push(notes[thirdIdx]);
      if (fifthIdx !== -1) rootlessNotes.push(notes[fifthIdx]);
      if (seventhIdx !== -1) rootlessNotes.push(notes[seventhIdx]);
      
      if (ninthIdx !== -1) {
        rootlessNotes.push(notes[ninthIdx]);
      } else if (seventhIdx !== -1) {
        // Add a default 9th (Major 9th = 14 semitones) if no 9th is present but 7th is
        rootlessNotes.push(rootMidi + 14);
      }
      
      if (eleventhIdx !== -1) rootlessNotes.push(notes[eleventhIdx]);
      if (thirteenthIdx !== -1) rootlessNotes.push(notes[thirteenthIdx]);
      
      return rootlessNotes.sort((a, b) => a - b);
    }

    case 'Drop 2': {
      let drop2Notes = [...notes];
      if (drop2Notes.length > 4) {
        drop2Notes = drop2Notes.slice(0, 4);
      }
      if (drop2Notes.length >= 3) {
        drop2Notes.sort((a, b) => a - b);
        const secondHighest = drop2Notes[drop2Notes.length - 2];
        drop2Notes[drop2Notes.length - 2] = secondHighest - 12;
        drop2Notes.sort((a, b) => a - b);
      }
      return drop2Notes;
    }

    case 'Closed':
    default:
      return [...notes].sort((a, b) => a - b);
  }
}

function getInversions(notes: number[]): number[][] {
  const inversions: number[][] = [notes];
  const len = notes.length;
  if (len === 0) return inversions;

  // Upward inversions
  for (let i = 1; i < len; i++) {
    const inv = [...inversions[i - 1]];
    inv[0] += 12;
    inv.sort((a, b) => a - b);
    inversions.push(inv);
  }
  
  // Downward inversions
  for (let i = 1; i < len; i++) {
    const inv = [...inversions[0]];
    inv[len - 1] -= 12;
    inv.sort((a, b) => a - b);
    inversions.unshift(inv);
  }

  return inversions;
}

function getCenterPitch(notes: number[]): number {
  if (notes.length === 0) return 60;
  return notes.reduce((sum, n) => sum + n, 0) / notes.length;
}

export function applyVoiceLeading(
  currentNotes: number[],
  prevNotes: number[] | null,
  mode: VoicingMode
): number[] {
  if (currentNotes.length === 0) return [];

  if (mode === 'Shell' || mode === 'Drop 2') {
    const center = getCenterPitch(currentNotes);
    if (center < 53) return currentNotes.map(n => n + 12);
    if (center > 72) return currentNotes.map(n => n - 12);
    return currentNotes;
  }

  const inversions = getInversions(currentNotes);

  if (!prevNotes || prevNotes.length === 0) {
    let bestInv = inversions[0];
    let minDiff = Infinity;
    
    for (const inv of inversions) {
      const center = getCenterPitch(inv);
      const diff = Math.abs(center - 60);
      if (center >= 53 && center <= 72 && diff < minDiff) {
        minDiff = diff;
        bestInv = inv;
      }
    }
    return bestInv;
  }

  const prevCenter = getCenterPitch(prevNotes);
  let bestInv = inversions[0];
  let minDistance = Infinity;

  for (const inv of inversions) {
    const center = getCenterPitch(inv);
    const distance = Math.abs(center - prevCenter);
    if (distance < minDistance) {
      minDistance = distance;
      bestInv = inv;
    }
  }

  return bestInv;
}

export function getChordVoicing(chordName: string, mode: VoicingMode, prevNotes: number[] | null): number[] {
  const parts = chordName.split('/');
  const cleanName = parts[0];
  const bassNote = parts[1];

  const baseNotes = getBaseNotes(cleanName, mode);
  
  // Remove bass note from prevNotes for smoother upper structure voice leading
  let upperPrevNotes = prevNotes;
  if (prevNotes && prevNotes.length > 0 && prevNotes[0] < 48) {
    upperPrevNotes = prevNotes.slice(1);
  }

  let voicedUpper = applyVoiceLeading(baseNotes, upperPrevNotes, mode);
  
  if (bassNote) {
    let bassMidi = toMidi(bassNote + '2');
    // Ensure bass is lower than the lowest upper note
    while (voicedUpper.length > 0 && bassMidi >= voicedUpper[0]) {
      bassMidi -= 12;
    }
    return [bassMidi, ...voicedUpper];
  }
  
  return voicedUpper;
}
