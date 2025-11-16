import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/common/Icon.tsx';

const playbackSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];

const qualityLabels: Record<string, string> = {
  auto: 'Auto',
  default: 'Auto',
  tiny: '144p',
  small: '240p',
  medium: '360p',
  large: '480p',
  hd720: '720p',
  hd1080: '1080p',
  hd1440: '1440p',
  hd2160: '2160p',
  highres: '2160p+',
};

const formatQualityLabel = (quality: string): string => qualityLabels[quality] ?? quality.toUpperCase();

const filterYoutubeChrome = (container?: HTMLElement | null): (() => void) | undefined => {
  if (!container) {
    return undefined;
  }

  const selectors = [
    '.ytp-chrome-top',
    '.ytp-title',
    '.ytp-youtube-button',
    '.ytp-impression-link',
    '.ytp-pause-overlay',
    '.ytp-watermark',
    '.ytp-watch-later-button',
    '.ytp-share-button',
    '.ytp-chrome-bottom',
    '.ytp-gradient-bottom',
    '.ytp-right-controls',
    '.ytp-left-controls',
    '.ytp-progress-bar-container',
    '.ytp-ce-element',
    '.ytp-ce-covering-overlay',
    '.ytp-ce-covering-image',
    '.ytp-ce-covering-shadow',
    '.ytp-endscreen-content',
    '.ytp-endscreen',
    '.ytp-upnext',
    '.ytp-show-cards-title',
    '.ytp-related-title',
    '.ytp-pc-thumbnail',
    '.ytp-spinner',
  ];

  const hideChrome = () => {
    selectors.forEach((selector) => {
      container.querySelectorAll(selector).forEach((element) => {
        const el = element as HTMLElement;
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
      });
    });
  };

  hideChrome();

  const observer = new MutationObserver(() => hideChrome());
  observer.observe(container, { childList: true, subtree: true });

  return () => observer.disconnect();
};

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
  getAvailableQualityLevels?: () => string[];
  getPlaybackQuality?: () => string;
  setPlaybackQuality?: (quality: string) => void;
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
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [skipIndicator, setSkipIndicator] = useState<'back' | 'forward' | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPosterVisible, setIsPosterVisible] = useState(Boolean(poster && videoUrl));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const tapTimestamps = useRef<{ back: number; forward: number }>({ back: 0, forward: 0 });

  useEffect(() => {
    setPlayerReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAvailableQualities([]);
    setSelectedQuality('auto');
    setIsSettingsOpen(false);
  }, [videoUrl]);

  useEffect(() => {
    setIsPosterVisible(Boolean(poster && videoUrl));
  }, [poster, videoUrl]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleFullScreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerShellRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setIsPosterVisible(false);
    }
  }, [isPlaying]);

  const syncYoutubePlaybackMeta = useCallback((instance: YouTubePlayer) => {
    setDuration(instance.getDuration() || 0);
    setPlaybackRate(instance.getPlaybackRate());
    const levels = instance.getAvailableQualityLevels?.() ?? [];
    if (levels.length) {
      const uniqueLevels = Array.from(new Set(levels));
      setAvailableQualities((previous) => {
        if (
          previous.length === uniqueLevels.length &&
          previous.every((level, index) => level === uniqueLevels[index])
        ) {
          return previous;
        }
        return uniqueLevels;
      });
    } else {
      setAvailableQualities((previous) => (previous.length ? [] : previous));
    }
    const currentQuality = instance.getPlaybackQuality?.();
    if (currentQuality) {
      setSelectedQuality(currentQuality);
    }
  }, []);

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
            syncYoutubePlaybackMeta(target);
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

            syncYoutubePlaybackMeta(target);
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
  }, [isYouTube, playerElementId, syncYoutubePlaybackMeta, videoId]);

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

  useEffect(() => {
    if (!isYouTube || !playerReady) {
      return;
    }

    const host = document.getElementById(playerElementId);
    const cleanup = filterYoutubeChrome(host);

    return () => {
      cleanup?.();
    };
  }, [isYouTube, playerElementId, playerReady]);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !settingsPanelRef.current?.contains(target) &&
        !settingsButtonRef.current?.contains(target)
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSettingsOpen]);

  const handlePlayPause = () => {
    if (!videoUrl) {
      return;
    }

    if (isPosterVisible) {
      setIsPosterVisible(false);
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

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') {
      return;
    }

    const shell = playerShellRef.current;
    if (!shell) {
      return;
    }

    if (document.fullscreenElement === shell) {
      void document.exitFullscreen?.();
      return;
    }

    if (!document.fullscreenElement) {
      const request = shell.requestFullscreen?.();
      request?.catch(() => {});
      return;
    }

    void document.exitFullscreen?.();
    const request = shell.requestFullscreen?.();
    request?.catch(() => {});
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

  const changeQuality = (value: string) => {
    if (!isYouTube || !youtubePlayerRef.current) {
      return;
    }

    youtubePlayerRef.current.setPlaybackQuality?.(value);
    setSelectedQuality(value);
  };

  const progressPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative">
      <div
        ref={playerShellRef}
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/30 via-white/5 to-white/10 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/30 backdrop-blur-2xl shadow-[0_45px_85px_rgba(15,23,42,0.55)]"
      >
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

          {poster && videoUrl && isPosterVisible && (
            <button
              type="button"
              onClick={handlePlayPause}
              className="absolute inset-0 z-20 flex h-full w-full items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              aria-label="Play preview video"
            >
              <img src={poster} alt={title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-2xl">
                  <Icon name="play" className="ml-1 h-7 w-7" />
                </div>
                <div className="max-w-xs text-lg font-semibold leading-snug drop-shadow-lg">{title}</div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80">Tap to play</p>
              </div>
            </button>
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
        <div className="relative z-10 flex flex-col gap-5 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={!videoUrl || (isYouTube && !playerReady)}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-lg shadow-black/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="mt-4 flex flex-col gap-4 text-sm text-white/80 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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

            <div className="flex flex-1 flex-col gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex flex-col gap-0.5 text-[11px] sm:flex-row sm:items-center sm:gap-2">
                <span>Speed</span>
                <span className="text-white/90">{playbackRate}x</span>
              </div>
              {isYouTube && (
                <div className="flex flex-col gap-0.5 text-[11px] sm:flex-row sm:items-center sm:gap-2">
                  <span>Quality</span>
                  <span className="text-white/90">{formatQualityLabel(selectedQuality)}</span>
                </div>
              )}

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="relative">
                  <button
                    ref={settingsButtonRef}
                    type="button"
                    onClick={() => setIsSettingsOpen((previous) => !previous)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition hover:bg-white/30"
                    aria-haspopup="dialog"
                    aria-expanded={isSettingsOpen}
                    aria-label="Playback settings"
                  >
                    <Icon name="settings" className="h-4 w-4" />
                  </button>

                  {isSettingsOpen && (
                    <div
                      ref={settingsPanelRef}
                      className="absolute bottom-12 right-0 z-20 w-64 rounded-3xl border border-white/20 bg-gradient-to-br from-white/40 via-white/10 to-white/20 p-4 text-white shadow-2xl backdrop-blur-xl dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-900/30"
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">Playback speed</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {playbackSpeeds.map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => changePlayback(speed)}
                              disabled={!videoUrl}
                              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${speed === playbackRate ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">Video quality</p>
                        {isYouTube && availableQualities.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {availableQualities.map((quality) => (
                              <button
                                key={quality}
                                type="button"
                                onClick={() => changeQuality(quality)}
                                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${quality === selectedQuality ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                              >
                                {formatQualityLabel(quality)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs normal-case tracking-normal text-white/70">
                            Quality selection becomes available when the YouTube player shares its formats.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition hover:bg-white/30"
                  aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
                >
                  <Icon name={isFullscreen ? 'minimize' : 'maximize'} className="h-4 w-4" />
                </button>
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
