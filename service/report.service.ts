import axiosInstance from "@/service/axios.service";

export type ReportFormat = "xlsx" | "csv" | "pdf";

export type ReportColumn = {
  key: string;
  header: string;
  type: "text" | "number" | "money" | "percent" | "date";
  width?: number;
};

export type ReportSummaryItem = {
  label: string;
  value: number | string;
  type: "money" | "number" | "text";
};

export type ReportResponse = {
  success: boolean;
  title: string;
  period: string;
  columns: ReportColumn[];
  summary: ReportSummaryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  truncated: boolean;
  rows: Record<string, any>[];
};

type Params = Record<string, string | number | undefined>;

export const getReport = (type: string, params: Params) =>
  axiosInstance.get<ReportResponse>(`/api/report/${type}`, { params });

// blob error er vitore JSON message thake, seta ber kore
const blobMessage = async (err: any): Promise<string> => {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text())?.message || "Download failed";
    } catch {
      return "Download failed";
    }
  }
  return data?.message || err?.message || "Download failed";
};

export const downloadReport = async (
  type: string,
  format: ReportFormat,
  params: Params,
  fileLabel?: string,
) => {
  try {
    const res = await axiosInstance.get(`/api/report/${type}/download`, {
      params: { ...params, format },
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileLabel || type}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    throw new Error(await blobMessage(err));
  }
};