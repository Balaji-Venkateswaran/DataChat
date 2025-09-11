import React from "react";
import { Box, Typography } from "@mui/material";

export default function MessageBubble() {
  return (
    <Box
      sx={{
        display: "flex",
        my: 1,
      }}
    >
      <Typography variant="body1">Analyzing Doc ...</Typography>
    </Box>
  );
}
