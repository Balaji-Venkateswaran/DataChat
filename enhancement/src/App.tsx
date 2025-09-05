import React, { useState } from "react";
import "./App.css";
import { DataChart } from "./pages/DataChart";
import { HeaderUpload } from "./shared/Header";
import { SideBar } from "./shared/SideBar";
import { ThemeContextProvider } from "./shared/ThemeContext";

function App() {
  const [isexpand, setExpand] = useState(false);

  function expand(val: boolean) {
    setExpand(val);
  }

  return (
    <ThemeContextProvider>
      <section className={isexpand ? "sideBarEnabled" : "sideBarDisabled"}>
        {isexpand && (
          <div>
            <SideBar />
          </div>
        )}

        <div>
          <div>
            <HeaderUpload expand={expand} />
          </div>
          <div>
            <DataChart />
          </div>
        </div>
      </section>
    </ThemeContextProvider>
  );
}

export default App;
