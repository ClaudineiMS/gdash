import { api } from "@/lib/http";

export const WeatherAPI = {
  latest: async () => {
    const { data } = await api.get("/weather/latest"); 
    return data;
  },

  history: async () => {
    const { data } = await api.get("/weather");
    return data;
  },

  insights: async () => {
    const { data } = await api.get("/weather/insights");
    return data;
  },

  exportCsv: async () => {
    const res = await api.get("/weather/export.csv", { responseType: "blob" });
    return res.data;
  },

  exportXlsx: async () => {
    const res = await api.get("/weather/export.xlsx", { responseType: "blob" });
    return res.data;
  },
};
