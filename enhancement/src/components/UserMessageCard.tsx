import React from "react";
import { Paper, Typography, Box } from "@mui/material";

interface UserMessageCardProps {
  message: string;
}

export default function UserMessageCard({ message }: UserMessageCardProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
      <Paper
        elevation={2}
        sx={{
          backgroundColor: "#1976d2",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: "12px",
          maxWidth: "70%",
        }}
      >
        <Typography variant="body1">{message}</Typography>
      </Paper>
    </Box>
  );
}
