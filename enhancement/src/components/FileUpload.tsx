// import * as React from 'react';
// import { styled } from '@mui/material/styles';
// import Button from '@mui/material/Button';
// import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// const VisuallyHiddenInput = styled('input')({
//   clip: 'rect(0 0 0 0)',
//   clipPath: 'inset(50%)',
//   height: 1,
//   overflow: 'hidden',
//   position: 'absolute',
//   bottom: 0,
//   left: 0,
//   whiteSpace: 'nowrap',
//   width: 1,
// });
//  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files && event.target.files[0];
//     console.log("Uploaded file:", file);
//   };

// export default function  FileUpload() {
//   return (
//     <Button
//       component="label"
//       role={undefined}
//       variant="contained"
//       tabIndex={-1}
//       startIcon={<CloudUploadIcon />}
//     >
//       Upload files
//       <VisuallyHiddenInput
//         type="file"
//           onChange={handleFileUpload}

//         multiple
//       />
//     </Button>
//   );
// }

import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface SchemaRow {
  column: string;
  type: "TEXT" | "NUMBER";
  default: string;
  PK: "YES" | "NO";
  Not_Null: "YES" | "NO";
}

export default function FileUpload() {
  const [schema, setSchema] = React.useState<SchemaRow[]>([]);

  const inferType = (values: any[]): "TEXT" | "NUMBER" => {
    let numberCount = 0;
    let textCount = 0;

    for (const value of values) {
      if (value === null || value === undefined || value === "") continue;
      if (!isNaN(value as number)) numberCount++;
      else textCount++;
    }

    return numberCount >= textCount ? "NUMBER" : "TEXT";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const ab = e.target?.result;
      const workbook = XLSX.read(ab, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      if (jsonData.length === 0) return;

      const columns = Object.keys(jsonData[0] as object);
      const schemaData: SchemaRow[] = columns.map((col) => {
        const values = jsonData.map((row: any) => row[col]);
        const type = inferType(values);
        return {
          column: col,
          type,
          default: "Null",
          PK: "NO",
          Not_Null: "NO",
        };
      });

      setSchema(schemaData);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <>
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
      >
        Upload File
        <VisuallyHiddenInput
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
        />
      </Button>

      {schema.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4 }}>
            Table :
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Column</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Default</strong>
                  </TableCell>
                  <TableCell>
                    <strong>PK</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Not_Null</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schema.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.column}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.default}</TableCell>
                    <TableCell>{row.PK}</TableCell>
                    <TableCell>{row.Not_Null}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
}
