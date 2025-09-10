import { useContext, useEffect, useState } from "react";
import { Switch, Typography } from "@mui/material";
import { ColorModeContext } from "./ThemeContext";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import "./shared.scss";

interface Props {
  expand: (value: boolean) => void;
}

export function HeaderUpload({ expand }: Props) {
  const [isExpand, setExpand] = useState(false);
  const { toggleColorMode, mode } = useContext(ColorModeContext);

  useEffect(() => {
    expand(isExpand);
  }, [isExpand, expand]);

  return (
    <nav className="header-upload">
      <div
        className={`headerDiv ${
          isExpand ? "sideBarExpand" : "sideBarNotExpand"
        }`}
      >
        <ArrowCircleRightIcon
          className="expand-icon"
          onClick={() => setExpand((prev) => !prev)}
          style={{
            cursor: "pointer",
            transform: isExpand ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Typography
            style={{ cursor: "pointer" }}
            onClick={toggleColorMode}
            fontSize={20}
          >
            {mode === "light" ? "🌑" : "🌟"}
          </Typography>
        </div>
      </div>
    </nav>
  );
}
