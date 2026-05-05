"use client";
import { memo, useState } from "react";
import {
  AudioPlayerProvider,
  SettingsContext,
  SettingsProvider,
} from "@/hooks";
import { ClickWheel, ViewManager } from "@/components";
import {
  ScreenContainer,
  ClickWheelContainer,
  Shell,
  Sticker,
  Sticker2,
  Sticker3,
} from "@/components/Ipod/Styled";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MusicKitProvider } from "@/providers/MusicKitProvider";
import ViewContextProvider from "@/providers/ViewContextProvider";
import { GlobalStyles } from "@/components/Ipod/GlobalStyles";

type Props = {
  appleAccessToken: string;
};

const Ipod = ({ appleAccessToken }: Props) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <SettingsProvider>
        <ViewContextProvider>
          <MusicKitProvider token={appleAccessToken}>
            <AudioPlayerProvider>
              <SettingsContext.Consumer>
                {([{ deviceTheme }]) => (
                  <Shell $deviceTheme={deviceTheme}>
                    <Sticker $deviceTheme={deviceTheme} />
                    <Sticker2 $deviceTheme={deviceTheme} />
                    <Sticker3 $deviceTheme={deviceTheme} />
                    <ScreenContainer>
                      <ViewManager />
                    </ScreenContainer>
                    <ClickWheelContainer>
                      <ClickWheel />
                    </ClickWheelContainer>
                  </Shell>
                )}
              </SettingsContext.Consumer>
            </AudioPlayerProvider>
          </MusicKitProvider>
        </ViewContextProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default memo(Ipod);
