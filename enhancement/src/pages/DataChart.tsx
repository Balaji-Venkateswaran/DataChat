import { useContext, useEffect, useMemo, useState } from "react";
import AskAnythingBar from "../components/AskAnythingBar";
import { IsData } from "../shared/IsDataContext";
import { inputQuery, table, TableStructure } from "../constant/model";
import SchemaTable from "../components/SchemaTable";
import QueryCard from "../components/QueryCard";
import UserQueryCard from "../components/UserQueryCard";

interface property {
  expand: boolean;
}
export function DataChart(props: property) {
  const ctx = useContext(IsData);
  const [userQueries, setUserQueries] = useState<string[]>([]);

  const [isHideHeaderPrompt, setHideHeaderPrompt] = useState<
    boolean | undefined
  >(false);
  const [isExpand, setExpand] = useState(false);
  useEffect(() => {
    setHideHeaderPrompt(ctx?.data);
  }, [ctx]);

  useMemo(() => {
    setExpand(props.expand);
  }, [props.expand]);

  const [table, setTable] = useState<table[]>([]);
  function handleUserQuery(queryText: string) {
    setUserQueries((prev) => [...prev, queryText]);
  }

  function getFileAndQuery(property: inputQuery) {}
  function getTable(newData: table[]) {
    console.log("newData", newData);
    setTable((prev) => [...prev, ...newData]);
  }

  return (
    <>
      {!isHideHeaderPrompt && (
        <p className="promptHeader">Ready when you are.</p>
      )}
      <div className="chatContainer">
        {isHideHeaderPrompt && (
          <>
            <div className="tableContainer">
              {table && <SchemaTable schema={table} />}
            </div>
            {userQueries.map((query, index) => (
              <UserQueryCard key={index} queryText={query} />
            ))}
            <QueryCard title="Sample Query" queryText="SELECT * FROM users;" />
          </>
        )}
        <div
          className={`${isHideHeaderPrompt ? "promptContainer" : ""} ${
            isExpand && isHideHeaderPrompt ? "isExpand" : "isNotExpand"
          }`}
        >
          <AskAnythingBar
            property={getFileAndQuery}
            tableStructure={getTable}
            userQuery={handleUserQuery}
          />
        </div>
      </div>
    </>
  );
}
