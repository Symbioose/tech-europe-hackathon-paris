let current: HTMLAudioElement | null = null;

export function play(url: string): Promise<void> {
  stop();
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.onended = () => {
      current = null;
      resolve();
    };
    audio.onerror = () => {
      current = null;
      resolve();
    };
    current = audio;
    audio.play().catch(() => {
      current = null;
      resolve();
    });
  });
}

export function stop() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}
