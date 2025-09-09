import { useContext } from "react";
import { ColorModeContext } from "./ThemeContext"; 
import "./shared.scss";

export function SideBar() {
  const { mode } = useContext(ColorModeContext);

  return (
    <div className={`sidebar ${mode}`}>
      <p>Side works</p>
    </div>
  );
}
