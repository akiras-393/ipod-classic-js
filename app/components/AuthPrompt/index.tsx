import { useMusicKit, useSettings } from "@/hooks";
import styled from "styled-components";
import { Unit } from "@/utils/constants";
import appleMusicIcon from "@public/apple_music_icon.svg";
import sadMacIcon from "@public/sad_mac.svg";

const RootContainer = styled.div`
  display: grid;
  place-content: center;
  text-align: center;
  height: 100%;
  background: white;
`;

const ImageContainer = styled.div`
  position: relative;
  height: 60px;
  width: 60px;
  margin: auto;
`;

const StyledImg = styled.img`
  position: absolute;
  top: 0%;
  left: 0;
  height: 100%;
  width: 100%;
`;

const Title = styled.h3`
  margin: ${Unit.XS} 0 ${Unit.XXS};
  font-weight: bold;
  font-size: 18px;
`;

const Text = styled.p`
  font-size: 14px;
  margin: 0;
  max-width: 120px;
  color: rgb(100, 100, 100);
`;

const strings = {
  title: "Apple Music",
  defaultMessage: "Sign in to view this content",
  offlineTitle: "Offline",
  offlineMessage: "Connect to the internet to view this content",
  noProviderTitle: "Music Provider",
  noProviderMessage: "Apple Music is unavailable. Please reload.",
};

interface Props {
  message?: string;
}

const AuthPrompt = ({ message }: Props) => {
  const { isOffline } = useSettings();
  const { isConfigured: isMkConfigured } = useMusicKit();

  if (isOffline) {
    return (
      <RootContainer>
        <ImageContainer>
          <StyledImg alt="offline" src={sadMacIcon.src} />
        </ImageContainer>
        <Title>{strings.offlineTitle}</Title>
        <Text>{strings.offlineMessage}</Text>
      </RootContainer>
    );
  }

  if (!isMkConfigured) {
    return (
      <RootContainer>
        <ImageContainer>
          <StyledImg alt="no_provider" src={sadMacIcon.src} />
        </ImageContainer>
        <Title>{strings.noProviderTitle}</Title>
        <Text>{strings.noProviderMessage}</Text>
      </RootContainer>
    );
  }

  return (
    <RootContainer>
      <ImageContainer>
        <StyledImg alt="app_icon" src={appleMusicIcon.src} />
      </ImageContainer>
      <Title>{strings.title}</Title>
      <Text>{message ?? strings.defaultMessage}</Text>
    </RootContainer>
  );
};

export default AuthPrompt;
