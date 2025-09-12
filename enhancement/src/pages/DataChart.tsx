import { useContext, useEffect, useMemo, useState } from "react";
import AskAnythingBar from "../components/AskAnythingBar";
import { IsData } from "../shared/IsDataContext";
import {
  inputQuery,
  loaderContainer,
  outputData,
  queryOutPut,
  table,
  TableStructure,
} from "../constant/model";
import SchemaTable from "../components/SchemaTable";
import QueryCard from "../components/QueryCard";
import UserQueryCard from "../components/UserQueryCard";
import OutputCard from "../components/OutputCard";
import axiosInstance from "../helper/httpAxios";
import StringLoader from "../components/StringLoader";
import ErrorSnackBar from "../components/ErrorSnackBar";
interface property {
  expand: boolean;
}
export function DataChart(props: property) {
  const ctx = useContext(IsData);
  const [outPutCard, setCardData] = useState<outputData[]>([]);
  const [loader, setLoader] = useState<loaderContainer>();
  const [loaderText, setLoaderText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setOpenSnackbar(true);
  };
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

  async function handleUserQuery(queryText: string) {
    let userQuery = {
      flag: false,
      content: queryText,
    };
    let loaderInfo = {
      loader: false,
      text: "",
    };
    setCardData((prev) => [...prev, userQuery]);
    let request = {
      context: "",
      question: queryText,
      chart_type: "",
      selected_llm_model: "",
    };

    if (queryText != "") {
      setLoader({
        loader: true,
        text: "Generating the Query",
      });
      try {
        const response: any = await axiosInstance.post(
          "/getdata_from_duckdb_muulti_context",
          request
        );
        if (await response) {
          const chatIntex = Object.keys(response).findIndex(
            (item) => item === "sql"
          );
          if (chatIntex != -1) {
            const responseQuery = {
              flag: true,
              content: response?.sql,
              table_html: response.table_html,
            };
            setCardData((prev) => [...prev, responseQuery]);
            setLoader({ ...loaderInfo });
          } else {
            showError("something is wrong");
            setLoader(loaderInfo);
          }
        }
      } catch (error: any) {
        showError(" DuckDB: Binder Error");
      } finally {
        setLoader(loaderInfo);
      }
    }
  }

  function getFileAndQuery(property: inputQuery) {}

  function getTable(newData: table[]) {
    setTable((prev) => [...prev, ...newData]);
  }

  function handleTableQuery(tableQuery: queryOutPut) {
    if (tableQuery) {
      const index = Object.keys(tableQuery).findIndex(
        (item) => item === "generated_questions"
      );
      if (index != -1) {
        const query = {
          flag: true,
          content: tableQuery?.generated_questions,
        };
        setCardData((prev) => [...prev, query]);
      }
    } else {
      showError("Parsing failed try again");
    }
  }
  function handleLoader(loader: loaderContainer) {
    setLoader(loader);
  }
  useEffect(() => {
    console.log("loaderText", loaderText);
  }, [loaderText]);

  return (
    <>
      {!isHideHeaderPrompt && (
        <p className="promptHeader">Ready when you are.</p>
      )}
      <div className="container">
        <div className="chatContainer">
          {isHideHeaderPrompt && (
            <>
              <div className="tableContainer">
                {table && <SchemaTable schema={table} />}
              </div>
              <OutputCard data={outPutCard} />
            </>
          )}
        </div>
        <div
          className={`${isHideHeaderPrompt ? "promptContainer" : ""} ${
            isExpand && isHideHeaderPrompt ? "isExpand" : "isNotExpand"
          }`}
        >
          {loader?.loader && <StringLoader text={loader?.text} />}
          <AskAnythingBar
            property={getFileAndQuery}
            tableStructure={getTable}
            userQuery={handleUserQuery}
            tableQuery={handleTableQuery}
            loader={handleLoader}
          />
        </div>
      </div>

      <ErrorSnackBar
        open={openSnackbar}
        message={errorMessage || ""}
        onClose={() => setOpenSnackbar(false)}
      />
    </>
  );
}
