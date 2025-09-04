import { useEffect, useState } from "react";
import "./shared.scss";
interface props {
  expand: (value: boolean) => void;
}
export function HeaderUpload(props: props) {
  const [isexpand, setExpand] = useState(false);
  useEffect(() => {
    props.expand(isexpand);
  }, [isexpand]);
  return (
    <nav>
      <div>DataChart</div>
      <div>Light</div>
      <button type="button" onClick={() => setExpand((prev) => !prev)}>
        {isexpand ? <span>L</span> : <span>R</span>}
      </button>
    </nav>
  );
}
