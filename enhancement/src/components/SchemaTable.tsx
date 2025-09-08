import React from "react";
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

interface SchemaRow {
  column: string;
  type: string;
  default: string;
  PK: boolean;
  Not_Null: boolean;
}

interface SchemaTableProps {
  schema: SchemaRow[];
}

const SchemaTable: React.FC<SchemaTableProps> = ({ schema }) => {
  if (schema.length === 0) return null;

  return (
    <>
      <Typography variant="h6" sx={{ mt: 4 }}>
        Table :
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Column</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Default</strong></TableCell>
              <TableCell><strong>PK</strong></TableCell>
              <TableCell><strong>Not_Null</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schema.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.column}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.default}</TableCell>
                <TableCell>{row.PK ? "Yes" : "No"}</TableCell>
                <TableCell>{row.Not_Null ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default SchemaTable;
