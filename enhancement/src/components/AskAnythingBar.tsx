import React from "react";
import { Paper } from "@mui/material";
import FileUpload from "./FileUpload";
import SearchButton from "./SearchButton";
import TextArea from "./TextArea";

export default function AskAnythingBar() {
  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 3,
        padding: "8px 12px",
        width: "100%",
        maxWidth: 800,
        margin: "auto",
      }}
    >
      <FileUpload />
      <SearchButton />
      <TextArea />
    </Paper>
  );
}
