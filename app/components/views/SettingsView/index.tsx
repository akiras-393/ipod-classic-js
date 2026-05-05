import { useCallback, useMemo } from "react";

import { getConditionalOption } from "@/components/SelectableList";
import SelectableList, {
  SelectableListOption,
} from "@/components/SelectableList";
import { SplitScreenPreview } from "@/components/previews";
import {
  useAudioPlayer,
  useMusicKit,
  useSelectableList,
  useSettings,
} from "@/hooks";

const THEMES = ["silver", "black", "u2"] as const;

const getThemeLabel = (theme: (typeof THEMES)[number]) => {
  if (theme === "u2") return "U2 Edition";
  return theme.charAt(0).toUpperCase() + theme.slice(1);
};

const formatCurrentLabel = (label: string, isCurrent: boolean) =>
  `${label}${isCurrent ? " (Current)" : ""}`;

const SettingsView = () => {
  const {
    isAuthorized,
    isOffline,
    deviceTheme,
    setDeviceTheme,
    shuffleMode,
    repeatMode,
    hapticsEnabled,
    setHapticsEnabled,
  } = useSettings();
  const { setShuffleMode, setRepeatMode } = useAudioPlayer();
  const {
    signIn: signInWithApple,
    signOut: signOutApple,
    isConfigured: isMkConfigured,
  } = useMusicKit();
  const { reset } = useAudioPlayer();

  const createResetHandler = useCallback(
    (handler: () => void | Promise<void>) => () => {
      reset();
      handler();
    },
    [reset]
  );

  const themeOptions: SelectableListOption[] = useMemo(
    () =>
      THEMES.map((theme) => ({
        type: "action",
        isSelected: deviceTheme === theme,
        label: formatCurrentLabel(getThemeLabel(theme), deviceTheme === theme),
        onSelect: () => setDeviceTheme(theme),
      })),
    [deviceTheme, setDeviceTheme]
  );

  const options: SelectableListOption[] = useMemo(
    () => [
      {
        type: "view",
        label: "About",
        viewId: "about",
        preview: SplitScreenPreview.Settings,
      },
      /** Add shuffle mode options */
      ...getConditionalOption(isAuthorized, {
        type: "actionSheet",
        id: "shuffle-mode-action-sheet",
        label: "Shuffle",
        listOptions: [
          {
            type: "action",
            isSelected: shuffleMode === "off",
            label: `Off ${shuffleMode === "off" ? "(Current)" : ""}`,
            onSelect: () => setShuffleMode("off"),
          },
          {
            type: "action",
            isSelected: shuffleMode === "songs",
            label: `Songs ${shuffleMode === "songs" ? "(Current)" : ""}`,
            onSelect: () => setShuffleMode("songs"),
          },
          {
            type: "action",
            isSelected: shuffleMode === "albums",
            label: `Albums ${shuffleMode === "albums" ? "(Current)" : ""}`,
            onSelect: () => setShuffleMode("albums"),
          },
        ],
        preview: SplitScreenPreview.Settings,
      }),
      /** Add repeat mode options */
      ...getConditionalOption(isAuthorized, {
        type: "actionSheet",
        id: "repeat-mode-action-sheet",
        label: "Repeat",
        listOptions: [
          {
            type: "action",
            isSelected: repeatMode === "off",
            label: `Off ${repeatMode === "off" ? "(Current)" : ""}`,
            onSelect: () => setRepeatMode("off"),
          },
          {
            type: "action",
            isSelected: repeatMode === "one",
            label: `One ${repeatMode === "one" ? "(Current)" : ""}`,
            onSelect: () => setRepeatMode("one"),
          },
          {
            type: "action",
            isSelected: repeatMode === "all",
            label: `All ${repeatMode === "all" ? "(Current)" : ""}`,
            onSelect: () => setRepeatMode("all"),
          },
        ],
        preview: SplitScreenPreview.Settings,
      }),
      {
        type: "actionSheet",
        id: "device-theme-action-sheet",
        label: "Device theme",
        listOptions: themeOptions,
        preview: SplitScreenPreview.Theme,
      },
      {
        type: "actionSheet",
        id: "haptics-action-sheet",
        label: "Haptic feedback",
        listOptions: [
          {
            type: "action",
            isSelected: hapticsEnabled,
            label: `On ${hapticsEnabled ? "(Current)" : ""}`,
            onSelect: () => setHapticsEnabled(true),
          },
          {
            type: "action",
            isSelected: !hapticsEnabled,
            label: `Off ${!hapticsEnabled ? "(Current)" : ""}`,
            onSelect: () => setHapticsEnabled(false),
          },
        ],
        preview: SplitScreenPreview.Settings,
      },
      /** Show the sign in option if not signed in and Apple Music is configured. */
      ...getConditionalOption(!isAuthorized && !isOffline && isMkConfigured, {
        type: "action",
        label: "Sign in to Apple Music",
        onSelect: signInWithApple,
      }),
      /** Show the sign out option if signed in. */
      ...getConditionalOption(isAuthorized && !isOffline, {
        type: "action",
        label: "Sign out",
        onSelect: createResetHandler(signOutApple),
      }),
    ],
    [
      isAuthorized,
      isOffline,
      isMkConfigured,
      themeOptions,
      shuffleMode,
      setShuffleMode,
      repeatMode,
      setRepeatMode,
      hapticsEnabled,
      setHapticsEnabled,
      signInWithApple,
      signOutApple,
      createResetHandler,
    ]
  );

  const { activeIndex: scrollIndex } = useSelectableList({ viewId: "settings", options });

  return <SelectableList options={options} activeIndex={scrollIndex} />;
};

export default SettingsView;
