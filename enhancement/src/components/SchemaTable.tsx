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
} from "@mui/material";
import { table, TableStructure } from "../constant/model";
interface SchemaTableProps {
  schema?: TableStructure | any;
}
export default function SchemaTable(props: SchemaTableProps) {
  const [schema, setSchema] = useState<TableStructure[]>([]);

  useMemo(() => {
    if (props.schema) {
      setSchema(props.schema);
    }
  }, [props.schema]);

  useEffect(() => {
    console.log(schema);
  }, [schema]);

  return (
    <>
      {schema.length &&
        schema.map((item, i) => {
          return (
            <>
              <Typography variant="h6" sx={{ mt: 4 }}>
                Table : {item.tableNames}
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
                    {item?.tableInfo.map((row, idx) => (
                      <TableRow key={idx}>
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
            </>
          );
        })}
    </>
  );
}
