import { motion } from "motion/react";
import styled from "styled-components";
import { Unit } from "@/utils/constants";
import appleMusicIcon from "@public/apple_music_icon.svg";

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  background: linear-gradient(180deg, #b1b5c0 0%, #686e7a 100%);
`;

const Image = styled.img`
  height: 6em;
  width: 6em;
  margin: ${Unit.XS};
`;

const Text = styled.h3`
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
`;

const Subtext = styled(Text)`
  font-size: 14px;
  font-weight: 400;
`;

const ServicePreview = () => {
  return (
    <Container>
      <Image alt="Service" src={appleMusicIcon.src} />
      <Text>Apple Music</Text>
      <Subtext>Selected service</Subtext>
    </Container>
  );
};

export default ServicePreview;
