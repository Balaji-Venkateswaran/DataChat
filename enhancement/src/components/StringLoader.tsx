import React from "react";
import { Box, Typography } from "@mui/material";
import { Loader } from "../constant/model";

export default function MessageBubble(props: Loader) {
  console.log(props);
  return (
    <Box
      sx={{
        display: "flex",
        my: 1,
      }}
    >
      <Typography variant="body1" className="loader-text loader-dots">
        {props.text}...
      </Typography>
    </Box>
  );
}
