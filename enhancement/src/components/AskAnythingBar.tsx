import React, { useContext, useEffect, useState } from "react";
import { Paper } from "@mui/material";
import FileUpload from "./FileUpload";
import SearchButton from "./SearchButton";
import TextArea from "./TextArea";
import { IsData } from "../shared/IsDataContext";
import * as XLSX from "xlsx";
// import initSqlJs, { Database, QueryExecResult } from "sql.js";
import initSqlJs, { Database, QueryExecResult } from "sql.js/dist/sql-wasm.js";
import {
  chatInput,
  inputQuery,
  table,
  TableColumn,
  TableStructure,
} from "../constant/model";

export default function AskAnythingBar(props: chatInput) {
  const ctx = useContext(IsData);
  const [tableStructure, setStructure] = useState<any[]>([]);

  const getFile = async (selectedFile: any) => {
    ctx?.setData(true);
    for (let i = 0; i < selectedFile.length; i++) {
      const file = selectedFile[i];
      const fileNameArr = file.name;
      const fileNameExtacter = fileNameArr.split(".");
      const fileName = fileNameExtacter[fileNameExtacter.length - 1];
      switch (fileName) {
        case "db":
          const DBfile = await extractDBfile(file);
          console.log("Parsed DB:", DBfile);
          setStructure((prev: any) => [...prev, ...(DBfile as any)]);
          props.tableStructure(DBfile as table);
          break;
        case "xlsx":
        case "csv":
        case "xls":
          const result: any = await extractXlsxFile(file);
          console.log("Parsed Structure:", file);
          setStructure((prev: any) => [...prev, ...result]);
          props.tableStructure(result as table);
          break;
      }
    }
  };

  const getQuery = (event: HTMLInputElement) => {
    console.log(event);
    if (event) {
      ctx?.setData(true);
    }
  };

  const extractXlsxFile = (file: any) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e: ProgressEvent<FileReader>) {
        try {
          const result = e.target?.result;
          if (!result) {
            reject(new Error("Failed to read file"));
            return;
          }

          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const tableStructure: TableStructure[] = [];

          for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<
              (string | number | null)[]
            >(worksheet, {
              header: 1,
            });

            if (jsonData.length < 2) continue;

            const headers = jsonData[0] as string[];
            const firstRow = jsonData[1];

            const inferredTypes = headers.map((_, idx) => {
              const val = firstRow?.[idx];
              if (val == null) return "NULL";
              return !isNaN(Number(val)) ? "NUMBER" : "TEXT";
            });

            const schema: TableColumn[] = headers.map((col, idx) => ({
              column: col,
              type: inferredTypes[idx],
              Default: "Null",
              PK: "NO",
              Not_Null: "NO",
            }));
            console.log(schema);
            tableStructure.push({
              tableNames: sheetName,
              tableInfo: schema,
            });
          }
          resolve(tableStructure);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };
  const extractDBfile = async (file: any) => {
    return new Promise((resolve, reject) => {
      initSqlJs({
        locateFile: (filename: string) => `./sql-wasm.wasm`,
      }).then((SQL) => {
        const reader = new FileReader();
        const tableStructure: TableStructure[] = [];
        reader.onload = function (event: ProgressEvent<FileReader>) {
          if (!event.target?.result) return;

          const uInt8Array = new Uint8Array(event.target.result as ArrayBuffer);
          const db: Database = new SQL.Database(uInt8Array);

          const result: QueryExecResult[] = db.exec(
            "SELECT name FROM sqlite_master WHERE type='table';"
          );

          if (!result.length) {
            console.log("No tables found.");
            return;
          }

          result.forEach((_, i) => {
            const tableNames = result[i].values.flat() as string[];

            tableNames.forEach((table) => {
              const pragma = db.exec(`PRAGMA table_info(${table});`);
              const tempArr: TableStructure = {
                tableNames: table,
                tableInfo: [],
              };

              pragma[0].values.forEach((row: any) => {
                const [cid, name, type, notnull, dflt_value, pk] = row;
                tempArr.tableInfo.push({
                  column: String(name),
                  type: String(type),
                  Default: dflt_value ? String(dflt_value) : "Null",
                  PK: pk === 1 ? "1" : "NO",
                  Not_Null: notnull === 1 ? "YES" : "NO",
                });
              });
              console.log(tempArr);
              tableStructure.push(tempArr);
              resolve(tableStructure);
            });
          });
        };

        reader.readAsArrayBuffer(file);
      });
    });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 3,
        padding: "8px 12px",
        width: "100%",
        maxWidth: 800,
        margin: "auto",
      }}
    >
      <FileUpload selectedFile={(file: File) => getFile(file)} />
      <SearchButton />
      <TextArea query={getQuery} />
    </Paper>
  );
}
