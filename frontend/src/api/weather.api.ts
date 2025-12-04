import { api } from "@/lib/http";
import dayjs from "dayjs";

export const WeatherAPI = {
  latest: async () => {
    const { data } = await api.get("/weather/latest");
    return data;
  },

  async history(page = 1, limit = 20) {
    const { data } = await api.get("/weather/history", {
      params: { page, limit },
    });
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

  getDay: async (date: string) => {
    const start = dayjs(date).startOf("day").toISOString(); 
    const end = dayjs(date).endOf("day").toISOString();     

    const { data } = await api.get("/weather/day-range", {
      params: { start, end },
    });

    return data;
  },
};
