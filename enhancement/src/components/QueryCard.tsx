import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

interface QueryCardProps {
  title: string;
  queryText: string;
}

const QueryCard: React.FC<QueryCardProps> = ({ title, queryText }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        backgroundColor: isDark ? "#1e1e1e" : "#fafafa",
        borderLeft: "4px solid #7e57c2",
        borderRadius: "8px",
        boxShadow: isDark
          ? "0 4px 10px rgba(255, 255, 255, 0.05)"
          : "0 4px 10px rgba(0, 0, 0, 0.1)",
        fontFamily: "monospace",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        padding: "8px 12px",
        width: "100%",
        maxWidth: "800px",
        margin: "auto",
        marginBottom: "120px",
      }}
      className="query-card"
    >
      <Typography
        variant="h6"
        sx={{
          marginBottom: "10px",
          color: isDark ? "#e0e0e0" : "#444",
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: "14px",
          color: isDark ? "#ccc" : "#333",
        }}
        className="query-text"
      >
        {queryText}
      </Typography>
    </Box>
  );
};

export default QueryCard;
