import { Box, Typography, useTheme } from "@mui/material";
import { outPutCard } from "../constant/model";

export default function OutputCard(props: outPutCard) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const flagTrueStyle = {
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
    marginBottom: "30px",
  };

  const flagFalseStyle = {
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
  };

  return (
    <>
      {props.data?.map((item, index) => (
        <>
          <Box key={index} sx={item.flag ? flagTrueStyle : flagFalseStyle}>
            <Typography
              variant="body2"
              sx={{
                fontSize: "14px",
                color: isDark ? "#ccc" : "#333",
              }}
            >
              <UnpackedElement data={item.content} />
            </Typography>
          </Box>
          {item.table_html && (
            <Box key={index} sx={item.flag ? flagTrueStyle : flagFalseStyle}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "14px",
                  color: isDark ? "#ccc" : "#333",
                }}
              >
                {item.table_html && <HtmlRenderer html={item.table_html} />}
              </Typography>
            </Box>
          )}
        </>
      ))}
    </>
  );
}

function UnpackedElement(props: any) {
  return Array.isArray(props.data) ? (
    <>
      {props.data.map((item: string, i: number) => (
        <p key={i}>
          {i + 1}. {item}
        </p>
      ))}
    </>
  ) : (
    <p>{props.data}</p>
  );
}

function HtmlRenderer({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
