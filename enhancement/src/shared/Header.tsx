import { useContext, useEffect, useState } from "react";
import { Switch, Typography } from "@mui/material";
import { ColorModeContext } from "./ThemeContext";
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
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <button className="expand-button" type="button" onClick={() => setExpand((prev) => !prev)}>
          {isExpand ? <span>{"◀"}</span> : <span>{"►"}</span>}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Typography>{mode === "light" ? "🌑" : "🌟"}</Typography>
          <Switch
            checked={mode === "dark"}
            onChange={toggleColorMode}
            inputProps={{ "aria-label": "theme toggle" }}
          />
        </div>
      </div>
    </nav>
  );
}
