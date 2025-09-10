import React, { useRef, useState, useEffect, JSX, useContext } from "react";
import { IconButton, Box } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Snackbar, Alert } from "@mui/material";
import { IsData } from "../shared/IsDataContext";
interface FileUploadProps {
  onFileUpload: (file: File) => void;
}
interface selectedFile {
  selectedFile: (file: any) => void;
}

export default function FileUpload(props: selectedFile): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
   const ctx = useContext(IsData);
  const showError = (message: string) => {
    setErrorMessage(message);
    setOpenSnackbar(true);
  };
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files;
  //   if (files) {
  //     props.selectedFile(files);
  //     // Array.from(files).forEach((file) => {
  //     //   if (isValidFileType(file)) {
  //     //     onFileUpload(file);
  //     //   } else {
  //     //     showError(`File type not allowed: ${file.name}`);
  //     //   }
  //     // });
  //   }
  // };

  // const handleDrop = (event: DragEvent) => {
  //   event.preventDefault();
  //   setIsDragging(false);
  //   const files = event.dataTransfer?.files;
  //   // if (files) {
  //   //   Array.from(files).forEach((file) => {
  //   //     if (isValidFileType(file)) {
  //   //       onFileUpload(file);
  //   //     } else {
  //   //       showError(`File type not allowed: ${file.name}`);
  //   //     }
  //   //   });
  //   // }
  // };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (files) {
    const validFiles = Array.from(files).filter(isValidFileType);
    const invalidFiles = Array.from(files).filter(file => !isValidFileType(file));

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(file => file.name).join(", ");
      showError(`File type not allowed: ${invalidNames}`);
    }

    if (validFiles.length > 0) {
      props.selectedFile(validFiles); 
    }

    event.target.value = ""; 
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  setIsDragging(false);

  const files = event.dataTransfer?.files;
  if (files) {
    const validFiles = Array.from(files).filter(isValidFileType);
    const invalidFiles = Array.from(files).filter(file => !isValidFileType(file));

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(file => file.name).join(", ");
      showError(`File type not allowed: ${invalidNames}`);
    }

    if (validFiles.length > 0) {
      props.selectedFile(validFiles);
    }
  }
};


  const isValidFileType = (file: File): boolean => {
    const allowedExtensions = [".csv", ".xls", ".xlsx", ".db"];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some((ext) => fileName.endsWith(ext));
  };

  const handleDragOver = (event: DragEvent) => {
    if (event.dataTransfer?.types.includes("Files")) {
      event.preventDefault();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept=".csv, .xls, .xlsx, .db"
        multiple
      />

      {isDragging && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.1)",
            border: "2px dashed #aaa",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Box sx={{ backgroundColor: "#fff", p: 2, borderRadius: 1 }}>
            Drop file to upload
            <small>Accepted: .csv, .xls, .xlsx, .db</small>
          </Box>
        </Box>
      )}

      <Box>
        <IconButton
          onClick={handleButtonClick}
          size="large"
          aria-label="Upload file"
        >
          <AttachFileIcon />
        </IconButton>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
