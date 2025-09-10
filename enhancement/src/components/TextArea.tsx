import React from "react";
import { InputBase } from "@mui/material";
interface query {
  query: (input: any) => void;
}

export default function TextArea(props: query) {
  function debounce(fun: any, delay: number) {
    let timer: any = null;
    return function (this: any, ...args: any) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fun.apply(this, args);
      }, delay);
    };
  }

  const getQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.query(event);
  };

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      props.query(event.currentTarget.value);
    }
  }

  const debouncedGetQuery = debounce(handleKeyDown, 300);
  return (
    <InputBase
      sx={{ ml: 2, flex: 1 }}
      placeholder="Enter your question here....."
      inputProps={{ "aria-label": "ask anything" }}
      onChange={debouncedGetQuery}
      onKeyDown={handleKeyDown}
      fullWidth={true}
    />
  );
}
