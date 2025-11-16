import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/common/Icon.tsx';

const playbackSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];

const loadScriptOnce = (src: string, id: string): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

const loadYoutubeApi = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    loadScriptOnce('https://www.youtube.com/iframe_api', 'youtube-iframe-api');
  });

  return youtubeApiPromise;
};

const extractYoutubeId = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      return parsed.pathname.replace('/', '').substring(0, 11) || null;
    }

    if (host.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2]?.substring(0, 11) ?? null;
      }

      const idFromQuery = parsed.searchParams.get('v');
      if (idFromQuery) {
        return idFromQuery.substring(0, 11);
      }
    }
  } catch (error) {
    console.warn('Unable to parse YouTube url', error);
  }

  return null;
};

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) {
    return '0:00';
  }
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface GlassPreviewPlayerProps {
  videoUrl?: string;
  poster?: string;
  title: string;
  caption?: string;
}

const GlassPreviewPlayer: React.FC<GlassPreviewPlayerProps> = ({ videoUrl, poster, title, caption }) => {
  const videoId = useMemo(() => extractYoutubeId(videoUrl), [videoUrl]);
  const isYouTube = Boolean(videoId);
  const playerElementId = useMemo(() => `glass-player-${videoId ?? Math.random().toString(36).slice(2)}`, [videoId]);

  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [skipIndicator, setSkipIndicator] = useState<'back' | 'forward' | null>(null);
  const tapTimestamps = useRef<{ back: number; forward: number }>({ back: 0, forward: 0 });

  useEffect(() => {
    setPlayerReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [videoUrl]);

  useEffect(() => {
    if (!isYouTube || !videoId) {
      return () => {};
    }

    let playerInstance: YouTubePlayer | null = null;
    let cancelled = false;

    const init = async () => {
      await loadYoutubeApi();
      if (cancelled || !videoId || !window.YT) {
        return;
      }

      playerInstance = new window.YT.Player(playerElementId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
          fs: 0,
          iv_load_policy: 3,
          disablekb: 1,
          playsinline: 1,
          cc_load_policy: 0,
        },
        events: {
          onReady: ({ target }) => {
            youtubePlayerRef.current = target;
            setDuration(target.getDuration() || 0);
            setPlaybackRate(target.getPlaybackRate());
            setPlayerReady(true);
          },
          onStateChange: ({ data, target }) => {
            const state = window.YT?.PlayerState;
            if (!state) {
              return;
            }

            if (data === state.PLAYING) {
              setIsPlaying(true);
            } else if (data === state.PAUSED || data === state.ENDED) {
              setIsPlaying(false);
            }

            setDuration(target.getDuration() || 0);
          },
        },
      });
    };

    init();

    return () => {
      cancelled = true;
      playerInstance?.destroy();
      youtubePlayerRef.current = null;
      setPlayerReady(false);
    };
  }, [isYouTube, playerElementId, videoId]);

  useEffect(() => {
    if (!isYouTube || !playerReady) {
      return;
    }

    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      const instance = youtubePlayerRef.current;
      if (!instance) {
        return;
      }
      const newCurrent = instance.getCurrentTime();
      const newDuration = instance.getDuration();
      setCurrentTime(newCurrent);
      setDuration(newDuration);
    }, 250);

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isYouTube, playerReady]);

  const handlePlayPause = () => {
    if (!videoUrl) {
      return;
    }

    if (isYouTube) {
      if (!youtubePlayerRef.current) {
        return;
      }
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
      return;
    }

    if (htmlVideoRef.current) {
      if (isPlaying) {
        htmlVideoRef.current.pause();
      } else {
        void htmlVideoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!htmlVideoRef.current) {
      return;
    }
    setCurrentTime(htmlVideoRef.current.currentTime);
    setDuration(htmlVideoRef.current.duration);
  };

  const handleSeek = (percentage: number) => {
    if (!Number.isFinite(duration) || duration === 0) {
      return;
    }
    const target = (percentage / 100) * duration;
    setCurrentTime(target);

    if (isYouTube && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(target, true);
      return;
    }

    if (htmlVideoRef.current) {
      htmlVideoRef.current.currentTime = target;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!duration || (!youtubePlayerRef.current && !htmlVideoRef.current)) {
      return;
    }
    const newTime = Math.min(Math.max(0, currentTime + seconds), duration);
    setCurrentTime(newTime);

    if (isYouTube && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else if (htmlVideoRef.current) {
      htmlVideoRef.current.currentTime = newTime;
    }

    setSkipIndicator(seconds > 0 ? 'forward' : 'back');
    window.setTimeout(() => setSkipIndicator(null), 500);
  };

  const handleDoubleTap = (direction: 'back' | 'forward') => {
    const now = Date.now();
    const lastTap = tapTimestamps.current[direction];
    tapTimestamps.current[direction] = now;
    if (now - lastTap < 300) {
      skipSeconds(direction === 'back' ? -10 : 10);
    }
  };

  const changePlayback = (value: number) => {
    setPlaybackRate(value);
    if (isYouTube && youtubePlayerRef.current) {
      youtubePlayerRef.current.setPlaybackRate(value);
    } else if (htmlVideoRef.current) {
      htmlVideoRef.current.playbackRate = value;
    }
  };

  const progressPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/30 via-white/5 to-white/10 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/30 backdrop-blur-2xl shadow-[0_45px_85px_rgba(15,23,42,0.55)]">
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
        <div className="relative aspect-video w-full overflow-hidden">
          {videoUrl ? (
            isYouTube ? (
              <div className="relative h-full w-full">
                <div id={playerElementId} className="h-full w-full" />
                {/* Mask watermark */}
                <div className="pointer-events-none absolute bottom-2 right-2 h-10 w-32 rounded-full bg-gradient-to-l from-black/60 via-black/30 to-transparent" />
              </div>
            ) : (
              <video
                key={videoUrl}
                ref={htmlVideoRef}
                className="h-full w-full object-cover"
                poster={poster}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                playsInline
                controls={false}
              >
                <source src={videoUrl} />
              </video>
            )
          ) : (
            <img src={poster} alt={title} className="h-full w-full object-cover" />
          )}

          {/* Double-tap zones */}
          {videoUrl && (
            <>
              <button
                type="button"
                className="absolute left-0 top-0 h-full w-1/3 cursor-pointer bg-gradient-to-r from-black/10 via-black/0 to-transparent text-left text-white/0"
                aria-label="Skip back 10 seconds"
                onDoubleClick={() => skipSeconds(-10)}
                onTouchEnd={() => handleDoubleTap('back')}
              />
              <button
                type="button"
                className="absolute right-0 top-0 h-full w-1/3 cursor-pointer bg-gradient-to-l from-black/10 via-black/0 to-transparent text-right text-white/0"
                aria-label="Skip forward 10 seconds"
                onDoubleClick={() => skipSeconds(10)}
                onTouchEnd={() => handleDoubleTap('forward')}
              />
            </>
          )}

          {skipIndicator && (
            <div className={`pointer-events-none absolute ${skipIndicator === 'back' ? 'left-6' : 'right-6'} top-1/2 -translate-y-1/2 rounded-2xl bg-black/40 px-4 py-3 text-sm font-semibold text-white backdrop-blur`}> 
              {skipIndicator === 'back' ? '−10s' : '+10s'}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />

          <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Preview</p>
              <h3 className="text-xl font-semibold drop-shadow-xl">{title}</h3>
            </div>
            {caption && <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">{caption}</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex flex-col gap-3 px-6 pb-6 pt-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={!videoUrl || (isYouTube && !playerReady)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-lg shadow-black/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} className="h-7 w-7" />
            </button>

            <div className="flex flex-1 flex-col">
              <input
                type="range"
                min={0}
                max={100}
                value={progressPercent}
                onChange={(event) => handleSeek(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
              />
              <div className="mt-1 flex items-center justify-between text-xs font-semibold text-white/70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => skipSeconds(-10)}
                className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                disabled={!videoUrl}
              >
                <Icon name="rewind" className="h-4 w-4" />
                10s
              </button>
              <button
                type="button"
                onClick={() => skipSeconds(10)}
                className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                disabled={!videoUrl}
              >
                <Icon name="fast-forward" className="h-4 w-4" />
                10s
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.3em] text-white/60">Speed</span>
              <div className="flex gap-1 overflow-hidden rounded-full border border-white/20 bg-white/10 p-0.5">
                {playbackSpeeds.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`rounded-full px-3 py-1 transition ${speed === playbackRate ? 'bg-white text-slate-900' : 'text-white/80'}`}
                    onClick={() => changePlayback(speed)}
                    disabled={!videoUrl}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="pointer-events-none absolute inset-x-6 -bottom-16 h-24 rounded-[32px] bg-gradient-to-t from-black/30 via-transparent to-transparent blur-2xl opacity-70" />
    </div>
  );
};

export default GlassPreviewPlayer;
