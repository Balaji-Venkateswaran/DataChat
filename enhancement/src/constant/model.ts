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
  userQuery?: (query: any) => void;
  tableQuery?: ((tableQuery: queryOutPut) => void | undefined) | undefined;
}

export interface queryOutPut {
  status?: number | string;
  generated_questions?: string[];
  flag?: boolean;
  content?: string;
  code?: number | string;
}

export interface outPutCard {
  data?: outputData[];
}

export interface outputData {
  flag?: boolean;
  content?: string[] | string;
  table_html?: string;
  isChatResponce?: boolean;
}
