import React, { useContext, useEffect, useState } from "react";
import { Paper, Box, Typography, IconButton, Stack } from "@mui/material";
import FileUpload from "./FileUpload";
import SearchButton from "./SearchButton";
import TextArea from "./TextArea";
import CloseIcon from "@mui/icons-material/Close";
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
import axiosInstance from "../helper/httpAxios";

export default function AskAnythingBar(props: chatInput) {
  const ctx = useContext(IsData);
  const [tableStructure, setStructure] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const getFile = async (selectedFile: any) => {
    ctx?.setData(true);
    setUploadedFiles((prevFiles) => [...prevFiles, ...selectedFile]);

    const responce = sendSelectedFile(selectedFile);
    console.log(responce);
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

  async function sendSelectedFile(selectedFile: any) {
    console.log(selectedFile);
    try {
      const formData = new FormData();
      formData.append("files", selectedFile);
      const response = await axiosInstance.post(
        "/upload_multifile_and_store_duckdb",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response);
    } catch (error: any) {
      console.error("POST request failed:", error);
      throw error;
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const getQuery = (input: string) => {
    console.log(input);
    if (input) {
      ctx?.setData(true);

      props.userQuery?.(input);
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
    <>
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          padding: "8px 12px",
          width: "100%",
          maxWidth: 800,
          margin: "auto",
        }}
      >
        {uploadedFiles.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mb: 1,
            }}
          >
            {uploadedFiles.map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#5b5b5d",
                  borderRadius: "12px",
                  px: 2,
                  py: 0.5,
                  color: "white",
                }}
              >
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {file.name}
                </Typography>
                <IconButton
                  size="small"
                  sx={{ color: "white", padding: 0 }}
                  onClick={() => handleRemoveFile(index)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FileUpload selectedFile={(file: File) => getFile(file)} />
          <SearchButton />
          <TextArea query={getQuery} />
        </Box>
      </Paper>
    </>
  );
}
