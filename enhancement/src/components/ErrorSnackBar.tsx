import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { ErrorSnackbarProps } from "../constant/model";

export default function ErrorSnackBar({
  open,
  message,
  onClose,
  duration = 6000,
}: ErrorSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert severity="error" onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}
