export interface inputQuery {
  file: any;
  query: String;
}

export interface table {
  tableStructure: TableStructure;
}

export interface TableStructure {
  tableNames: string;
  tableInfo: TableColumn[];
}

export interface TableColumn {
  column: string;
  type: string;
  Default: string;
  PK: string;
  Not_Null: string;
}

export interface chatInput {
  property: (inputQuery: inputQuery) => void;
  tableStructure: (property: any) => void;

  userQuery?: (query: string) => void;
}
