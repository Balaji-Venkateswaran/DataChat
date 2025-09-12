import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import { DataChart } from "./pages/DataChart";
import { HeaderUpload } from "./shared/Header";
import { SideBar } from "./shared/SideBar";
import { ThemeContextProvider } from "./shared/ThemeContext";
import DataProvide, { IsData } from "./shared/IsDataContext";

function App() {
  const [isexpand, setExpand] = useState(false);
  const [isMiddle, setIsMiddle] = useState<boolean | undefined>(false);
  const ctx = useContext(IsData);
  function expand(val: boolean) {
    setExpand(val);
  }
  useEffect(() => {
    setIsMiddle(ctx?.data);
  }, [ctx]);
  return (
    <ThemeContextProvider>
      <section className={isexpand ? "sideBarEnabled" : "sideBarDisabled"}>
        {isexpand && (
          <div className="sidebar">
            <SideBar />
          </div>
        )}

        <div className="dataChartMainContent">
          <div className="dataChartHeader">
            <HeaderUpload expand={expand} />
          </div>
          <div
            className={`dataChartBody ${
              isMiddle ? "dataChartHaveData" : "dataChartHaveNoData"
            }`}
          >
            <div className="">
              <DataChart expand={isexpand} />
            </div>
          </div>
        </div>
      </section>
    </ThemeContextProvider>
  );
}

export default App;
