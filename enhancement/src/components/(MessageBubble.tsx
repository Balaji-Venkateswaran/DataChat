import React from "react";
import { Box, Typography } from "@mui/material";

interface MessageProps {
  text: string;
  sender: "user" | "assistant";
}

export default function MessageBubble({ text, sender }: MessageProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: sender === "user" ? "flex-end" : "flex-start",
        my: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: "60%",
          px: 2,
          py: 1,
          borderRadius: 2,
          backgroundColor: sender === "user" ? "#3b82f6" : "#4b5563",
          color: "#fff",
          alignSelf: sender === "user" ? "flex-end" : "flex-start",
        }}
      >
        <Typography variant="body1">{text}</Typography>
      </Box>
    </Box>
  );
}
