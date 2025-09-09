import { useContext, useEffect, useState } from "react";
import AskAnythingBar from "../components/AskAnythingBar";
import { IsData } from "../shared/IsDataContext";
import { inputQuery, table, TableStructure } from "../constant/model";
import SchemaTable from "../components/SchemaTable";

export function DataChart() {
  const ctx = useContext(IsData);
  const [isHideHeaderPrompt, setHideHeaderPrompt] = useState<
    boolean | undefined
  >(false);
  useEffect(() => {
    setHideHeaderPrompt(ctx?.data);
  }, [ctx]);

  const [table, setTable] = useState<table>();

  function getFileAndQuery(property: inputQuery) {}
  function getTable(table: table) {
    setTable(table);
  }
  return (
    <>
      {!isHideHeaderPrompt && (
        <p className="promptHeader">Ready when you are.</p>
      )}
      <div className="chatContainer">
        {isHideHeaderPrompt && (
          <div className="tableContainer">
            <SchemaTable schema={table} />
          </div>
        )}
        <div className={isHideHeaderPrompt ? "promptContainer" : ""}>
          <AskAnythingBar
            property={getFileAndQuery}
            tableStructure={getTable}
          />
        </div>
      </div>
    </>
  );
}
