import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { DataChart } from "./pages/DataChart";
import { HeaderUpload } from "./shared/Header";
import { SideBar } from "./shared/SideBar";

function App() {
  const [isexpand, setExpand] = useState(false);
  function expand(val: boolean) {
    setExpand(val);
  }
  return (
    <>
      <section className={isexpand ? "sideBarEnabled" : "sideBarDisabled"}>
        {isexpand && (
          <div>
            <SideBar />
          </div>
        )}

        <div>
          <div>
            <HeaderUpload expand={(val: boolean) => expand(val)} />
          </div>
          <div>
            <DataChart />
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
