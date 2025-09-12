import React from "react";
import { IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchButton() {
  return (
    <IconButton sx={{ color: "#aaa" }} size="small">
      <SearchIcon fontSize="small" />
    </IconButton>
  );
}
