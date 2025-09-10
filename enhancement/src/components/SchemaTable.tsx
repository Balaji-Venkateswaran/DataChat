import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  useTheme,
} from "@mui/material";
import { table, TableStructure } from "../constant/model";

interface SchemaTableProps {
  schema?: TableStructure[] | any;
}

export default function SchemaTable(props: SchemaTableProps) {
  const [schema, setSchema] = useState<TableStructure[]>([]);
  const theme = useTheme();

  useMemo(() => {
    if (props.schema) {
      setSchema(props.schema);
    }
  }, [props.schema]);

  useEffect(() => {
    console.log(schema);
  }, [schema]);

  const getRowBackground = (index: number) => {
    if (index % 2 === 0) {
      return theme.palette.mode === "dark"
        ? theme.palette.grey[800]
        : theme.palette.grey[100];
    } else {
      return theme.palette.mode === "dark"
        ? theme.palette.grey[900]
        : theme.palette.common.white;
    }
  };

  const headerStyle = {
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.grey[700]
        : theme.palette.grey[300],
    color: theme.palette.text.primary,
  };

  return (
    <>
      {schema.length !== 0 &&
        schema.map((item, i) => (
          <Box sx={{ mt: 8 }} key={i}>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Table : {item.tableNames}
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={headerStyle}>
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
                  {item?.tableInfo.map((row, idx) => (
                    <TableRow key={idx} sx={{ backgroundColor: getRowBackground(idx) }}>
                      <TableCell>{row.column}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.Default}</TableCell>
                      <TableCell>{row.PK ? "Yes" : "No"}</TableCell>
                      <TableCell>{row.Not_Null ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
    </>
  );
}
