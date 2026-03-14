import * as Tone from 'tone';

let sampler: Tone.Sampler | null = null;
let isLoaded = false;
let initPromise: Promise<void> | null = null;

export async function initAudio(): Promise<void> {
  if (isLoaded) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    await Tone.start();
    
    return new Promise<void>((resolve) => {
      sampler = new Tone.Sampler({
        urls: {
          A0: "A0.mp3",
          C2: "C2.mp3",
          "D#3": "Ds3.mp3",
          "F#4": "Fs4.mp3",
          A5: "A5.mp3",
          C7: "C7.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        onload: () => {
          isLoaded = true;
          resolve();
        }
      }).toDestination();
    });
  })();
  
  return initPromise;
}

export function playNotes(midiNotes: number[], duration: string = "2n", time?: number) {
  if (!sampler || !isLoaded) return;
  
  const t = time !== undefined ? time : Tone.now();
  const freqs = midiNotes.map(m => Tone.Frequency(m, "midi").toNote());
  sampler.triggerAttackRelease(freqs, duration, t);
}

export function stopAudio() {
  if (sampler) {
    sampler.releaseAll();
  }
}
