import React from "react";
import { InputBase } from "@mui/material";

export default function TextArea() {
  return (
    <InputBase
      sx={{ ml: 2, flex: 1 }}
      placeholder="Enter your question here..."
      inputProps={{ "aria-label": "ask anything" }}
    />
  );
}
