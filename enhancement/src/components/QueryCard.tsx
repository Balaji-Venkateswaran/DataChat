
import React from "react";
import { Box, Typography } from "@mui/material";

interface QueryCardProps {
  title: string;
  queryText: string;
}

const QueryCard: React.FC<QueryCardProps> = ({ title, queryText }) => {
  return (
    <Box
      sx={{
        backgroundColor: "var(--tablenth-bg-color)",
        borderLeft: "4px solid #7e57c2",
        // padding: "15px",
        // margin: "20px 30px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        fontFamily: "monospace",
        // wordWrap: "break-word",
        // overflowWrap: "break-word",
        padding: "8px 12px",
        width: "100%",
        maxWidth: "800px",
        margin: "auto",
        marginBottom: "20px",
      }}
      className="query-card"
    >
      <Typography variant="h6" sx={{ marginBottom: "10px", color: "#444" }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: "14px", color: "#333" }}
        className="query-text"
      >
        {queryText}
      </Typography>
    </Box>
  );
};

export default QueryCard;