import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useEventListener, useMKEventListener, useHapticFeedback } from "@/hooks";
import * as ConversionUtils from "@/utils/conversion";

import {
  useMusicKit,
  useSettings,
  VOLUME_KEY,
  ShuffleMode,
  RepeatMode,
} from "..";
import { IpodEvent } from "@/utils/events";

const defaultPlaybackInfoState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentTime: 0,
  timeRemaining: 0,
  percent: 0,
  duration: 0,
};

interface AudioPlayerState {
  playbackInfo: typeof defaultPlaybackInfoState;
  nowPlayingItem?: MediaApi.MediaItem;
  volume: number;
  shuffleMode: ShuffleMode;
  repeatMode: RepeatMode;
  play: (queueOptions: MediaApi.QueueOptions) => Promise<void>;
  pause: () => Promise<void>;
  seekToTime: (time: number) => Promise<void>;
  setVolume: (volume: number) => void;
  setShuffleMode: (mode: ShuffleMode) => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  updateNowPlayingItem: () => Promise<void>;
  updatePlaybackInfo: () => Promise<void>;
  reset: () => void;
}

export const AudioPlayerContext = createContext<AudioPlayerState>(
  {} as AudioPlayerState
);

type AudioPlayerHook = AudioPlayerState;

export const useAudioPlayer = (): AudioPlayerHook => {
  const state = useContext(AudioPlayerContext);

  return state;
};

interface Props {
  children: React.ReactNode;
}

export const AudioPlayerProvider = ({ children }: Props) => {
  const {
    isAppleAuthorized,
    shuffleMode,
    repeatMode,
    setShuffleMode: updateShuffleModeSetting,
    setRepeatMode: updateRepeatModeSetting,
  } = useSettings();
  const { music } = useMusicKit();
  const [volume, setVolume] = useState(0.5);
  const [nowPlayingItem, setNowPlayingItem] = useState<MediaApi.MediaItem>();
  const [playbackInfo, setPlaybackInfo] = useState(defaultPlaybackInfoState);

  const hasNowPlayingItem = !!nowPlayingItem;

  const play = useCallback(
    async (queueOptions: MediaApi.QueueOptions) => {
      if (!isAppleAuthorized) {
        throw new Error("Unable to play: Not authorized");
      }

      // MusicKit JS V3 doesn't support passing a single playlist id to the queue.
      // Workaround: extract the song ids instead.
      const playlistSongs = queueOptions.playlist?.songs?.map(({ id }) => id);

      // When startPosition is provided with an album, MusicKit ignores it.
      // Workaround: pass the album's songs as individual song IDs.
      const albumSongs = queueOptions.album?.songs?.map((song) => song.id);

      // MusicKit JS V3 expects only a single media type with no empty keys.
      const queue: Partial<MusicKit.SetQueueOptions> = {};

      if (albumSongs) {
        queue.songs = albumSongs;
      } else if (queueOptions.album?.id) {
        queue.album = queueOptions.album.id;
      } else if (playlistSongs) {
        queue.songs = playlistSongs;
      } else if (queueOptions.songs) {
        queue.songs = queueOptions.songs.map((song) => song.url);
      } else if (queueOptions.song?.id) {
        queue.song = queueOptions.song.id;
      }

      await music.setQueue(queue);

      // Jump to the selected track if needed (MusicKit defaults to index 0)
      if (queueOptions.startPosition) {
        await music.changeToMediaAtIndex(queueOptions.startPosition);
      }

      // Only call play() if not already playing (changeToMediaAtIndex may auto-start playback)
      if (!music.isPlaying) {
        await music.play();
      }
    },
    [isAppleAuthorized, music]
  );

  const pause = useCallback(async () => {
    return music.pause();
  }, [music]);

  const togglePlayPause = useCallback(async () => {
    if (!hasNowPlayingItem) {
      return;
    }

    if (music.isPlaying) {
      music.pause();
    } else {
      music.play();
    }
  }, [hasNowPlayingItem, music]);

  const skipNext = useCallback(async () => {
    if (!nowPlayingItem) {
      return;
    }

    setPlaybackInfo((prevState) => ({
      ...prevState,
      isLoading: true,
    }));

    try {
      if (music.nowPlayingItem) {
        await music.skipToNextItem();
      }
    } finally {
      setPlaybackInfo((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
    }
  }, [music, nowPlayingItem]);

  const skipPrevious = useCallback(async () => {
    if (!nowPlayingItem) {
      return;
    }

    setPlaybackInfo((prevState) => ({
      ...prevState,
      isLoading: true,
    }));

    try {
      if (music.nowPlayingItem) {
        await music.skipToPreviousItem();
      }
    } finally {
      setPlaybackInfo((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
    }
  }, [music, nowPlayingItem]);

  const updateNowPlayingItem = useCallback(async () => {
    let mediaItem: MediaApi.MediaItem | undefined;

    if (music.nowPlayingItem) {
      mediaItem = ConversionUtils.convertAppleMediaItem(music.nowPlayingItem);
    }

    setNowPlayingItem(mediaItem);
  }, [music]);

  const handleApplePlaybackStateChange = useCallback(
    ({ state }: { state: MusicKit.PlaybackStates }) => {
      let isLoading = false;
      let isPlaying = false;
      let isPaused = false;

      switch (state) {
        case MusicKit.PlaybackStates.playing:
          isPlaying = true;
          break;
        case MusicKit.PlaybackStates.paused:
          isPaused = true;
          break;
        case MusicKit.PlaybackStates.loading:
        case MusicKit.PlaybackStates.waiting:
        case MusicKit.PlaybackStates.stalled:
          isLoading = true;
          break;
      }

      setPlaybackInfo((prevState) => ({
        ...prevState,
        isPlaying,
        isPaused,
        isLoading,
      }));

      updateNowPlayingItem();
    },
    [updateNowPlayingItem]
  );

  const updatePlaybackInfo = useCallback(async () => {
    setPlaybackInfo((prevState) => ({
      ...prevState,
      currentTime: music.currentPlaybackTime,
      timeRemaining: music.currentPlaybackTimeRemaining,
      percent: music.currentPlaybackProgress * 100,
      duration: music.currentPlaybackDuration,
    }));
  }, [music]);

  const seekToTime = useCallback(
    async (time: number) => {
      await music.seekToTime(time);
      updatePlaybackInfo();
    },
    [music, updatePlaybackInfo]
  );

  const handleChangeVolume = useCallback(
    (newVolume: number) => {
      if (isAppleAuthorized) {
        music.volume = newVolume;
      }

      localStorage.setItem(VOLUME_KEY, `${newVolume}`);

      setVolume(newVolume);
    },
    [isAppleAuthorized, music]
  );

  const reset = useCallback(() => {
    if (isAppleAuthorized) {
      music.stop();
    }

    setNowPlayingItem(undefined);
    setPlaybackInfo(defaultPlaybackInfoState);
  }, [isAppleAuthorized, music]);

  const handleSetShuffleMode = useCallback(
    async (mode: ShuffleMode) => {
      updateShuffleModeSetting(mode);

      music.shuffleMode =
        mode === "off"
          ? MusicKit.PlayerShuffleMode.off
          : MusicKit.PlayerShuffleMode.songs;
    },
    [music, updateShuffleModeSetting]
  );

  const handleSetRepeatMode = useCallback(
    async (mode: RepeatMode) => {
      updateRepeatModeSetting(mode);

      const modeMap = {
        off: MusicKit.PlayerRepeatMode.none,
        one: MusicKit.PlayerRepeatMode.one,
        all: MusicKit.PlayerRepeatMode.all,
      } as const;
      music.repeatMode = modeMap[mode];
    },
    [music, updateRepeatModeSetting]
  );

  const { triggerHaptics } = useHapticFeedback();

  const handlePlayPauseClick = useCallback(() => {
    triggerHaptics();
    togglePlayPause();
  }, [togglePlayPause, triggerHaptics]);

  const handleSkipNext = useCallback(() => {
    triggerHaptics();
    skipNext();
  }, [skipNext, triggerHaptics]);

  const handleSkipPrevious = useCallback(() => {
    triggerHaptics();
    skipPrevious();
  }, [skipPrevious, triggerHaptics]);

  useEventListener<IpodEvent>("playpauseclick", handlePlayPauseClick);
  useEventListener<IpodEvent>("forwardclick", handleSkipNext);
  useEventListener<IpodEvent>("backwardclick", handleSkipPrevious);

  useMKEventListener("playbackStateDidChange", handleApplePlaybackStateChange);
  useMKEventListener("queuePositionDidChange", updateNowPlayingItem);

  useEffect(() => {
    if (isAppleAuthorized) {
      const savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? "0.5");
      handleChangeVolume(savedVolume);
    }
  }, [handleChangeVolume, isAppleAuthorized]);

  return (
    <AudioPlayerContext.Provider
      value={{
        playbackInfo,
        nowPlayingItem,
        volume,
        shuffleMode,
        repeatMode,
        play,
        pause,
        seekToTime,
        setVolume: handleChangeVolume,
        setShuffleMode: handleSetShuffleMode,
        setRepeatMode: handleSetRepeatMode,
        togglePlayPause,
        updateNowPlayingItem,
        updatePlaybackInfo,
        skipNext,
        skipPrevious,
        reset,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default useAudioPlayer;
