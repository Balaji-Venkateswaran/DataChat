import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

interface UserQueryCardProps {
  queryText: string;
}

const UserQueryCard: React.FC<UserQueryCardProps> = ({ queryText }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        borderLeft: "4px solid #00f134",
        borderRadius: "8px",
        boxShadow: isDark
          ? "0 4px 10px rgba(255, 255, 255, 0.1)"
          : "0 4px 10px rgba(0, 0, 0, 0.1)",
        fontFamily: "monospace",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        padding: "8px 12px",
        maxWidth: "400px",
        marginLeft: "auto",
        marginRight: "290px",
        marginBottom: "30px",
        backgroundColor: isDark ? "#252525" : "#f9f9f9",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: "14px",
          color: isDark ? "#ddd" : "#333",
        }}
        className="query-text"
      >
        {queryText}
      </Typography>
    </Box>
  );
};

export default UserQueryCard;
