import { useContext, useEffect } from "react";
import AskAnythingBar from "../components/AskAnythingBar";
import { IsData } from "../shared/IsDataContext";

export function DataChart() {
  const ctx = useContext(IsData);

  return (
    <>
      <AskAnythingBar />
    </>
  );
}
