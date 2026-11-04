'use client';

import { useEffect, useRef } from 'react';

const KEY = 'ayendri_intro_audio_played';

export default function FirstVisitAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if ((window as any).__introAudio) return; // inline script already handles it
    try {
      if (localStorage.getItem(KEY) === '1') {
        console.log('[audio] already played, skipping');
        return;
      }
    } catch {}

    const audio = audioRef.current;
    if (!audio) return;

    audio.onerror = () => console.error('[audio] failed to load', audio.error);

    const events = ['pointerdown', 'click', 'touchend', 'keydown'] as const;

    const markPlayed = () => {
      try {
        localStorage.setItem(KEY, '1');
      } catch {}
    };

    const cleanup = () =>
      events.forEach((e) => window.removeEventListener(e, unlock));

    const unlock = () => {
      audio
        .play()
        .then(() => {
          markPlayed();
          cleanup();
        })
        .catch((err) => console.warn('[audio] play on interaction failed', err));
    };

    audio
      .play()
      .then(() => {
        console.log('[audio] autoplay worked');
        markPlayed();
      })
      .catch((err) => {
        console.warn('[audio] autoplay blocked, waiting for interaction', err);
        events.forEach((e) => window.addEventListener(e, unlock));
      });

    return cleanup;
  }, []);

  return <audio ref={audioRef} src="/audio/loading.mp3" preload="auto" />;
}