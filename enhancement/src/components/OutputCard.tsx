import { useState } from "react";
import { outPutCard } from "../constant/model";
import { Box, Typography, useTheme } from "@mui/material";

export default function OutputCard(props: outPutCard) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <>
      {props.data &&
        props.data.map((displayItem) => {
          return (
            <Box className={displayItem?.flag ? "" : ""}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "14px",
                  color: isDark ? "#ccc" : "#333",
                }}
              >
                <UnpackedElement data={displayItem.content} />
                {displayItem.table_html && (
                  <HtmlRenderer html={displayItem.table_html} />
                )}
              </Typography>
            </Box>
          );
        })}
    </>
  );
}

function UnpackedElement(props: any) {
  if (Array.isArray(props.data)) {
  }

  return (
    <>
      {props.data && Array.isArray(props.data) ? (
        props.data.map((item: string, i: number) => (
          <p>
            {i + 1} {item}
          </p>
        ))
      ) : (
        <p>{props.data}</p>
      )}
    </>
  );
}

function HtmlRenderer({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
