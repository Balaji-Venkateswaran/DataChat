import React from "react";
import { Bar, Line, Pie, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  RadarController,
  Tooltip,
  Legend
);

interface Props {
  data: any;
  type: string;
}

const ChartComponent: React.FC<Props> = ({ data, type }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Chart from Excel Data",
      },
    },
  };

  const chartProps = { data, options };

  switch (type) {
    case "bar":
      return <Bar {...chartProps} />;
    case "line":
      return <Line {...chartProps} />;
    case "pie":
      return <Pie {...chartProps} />;
    case "doughnut":
      return <Doughnut {...chartProps} />;
    case "radar":
      return <Radar {...chartProps} />;
    default:
      return <Bar {...chartProps} />;
  }
};

export default ChartComponent;
