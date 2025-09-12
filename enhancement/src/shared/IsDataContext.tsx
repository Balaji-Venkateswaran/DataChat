import { createContext, ReactNode, useState } from "react";

type IsData = {
  data: boolean;
  setData: (v: boolean) => void;
};

export const IsData = createContext<IsData | null>(null);

export default function DataProvide({ children }: { children: ReactNode }) {
  const [data, setData] = useState(false);
  return (
    <IsData.Provider value={{ data, setData }}>{children}</IsData.Provider>
  );
}
