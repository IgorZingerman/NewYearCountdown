#!/usr/bin/env node
import React from "react";
import { render, Box, Text } from "ink";
import BigText from "ink-big-text";

// Available fonts from ink-big-text
const AVAILABLE_FONTS = [
  "block",
  "slick",
  "tiny",
  "grid",
  "pallet",
  "shade",
  "simple",
  "simpleBlock",
  "3d",
  "simple3d",
  "chrome",
  "huge",
];

const FontPreview = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Available Font Options for Countdown:
      </Text>
      <Box marginTop={1} flexDirection="column">
        {AVAILABLE_FONTS.map((font, index) => (
          <Box key={font} flexDirection="column" marginBottom={1}>
            <Text color="yellow">{font}:</Text>
            <BigText font={font} text="00 00 00" align="center" />
          </Box>
        ))}
      </Box>
      <Box marginTop={2}>
        <Text color="green">
          To use a font, add "font": "fontname" to your config.json file
        </Text>
      </Box>
    </Box>
  );
};

render(<FontPreview />);

