import * as Chord from '@tonaljs/chord';

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

const testChords = [
  "G#7(13)",
  "CM7(13)",
  "Dm7(13)",
  "F7(b13)"
];

for (const c of testChords) {
  const norm = normalizeChordName(c);
  const chord = Chord.get(norm);
  console.log(`${c} -> ${norm} : empty=${chord.empty}, intervals=${chord.intervals}`);
}
