import axios from "axios";
import { error } from "console";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/",
});

axiosInstance.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response.status == 500) {
      console.log("Internal error");
    }
  }
);

export default axiosInstance;
