import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import DataProvide from "./shared/IsDataContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <DataProvide>
      <App />
    </DataProvide>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
reportWebVitals();
