"use client";

import { ReportTabs } from "@/components/reports/ReportView";

export default function ProductReportPage() {
  return (
    <ReportTabs
      tabs={[
        {
          label: "Most selling",
          props: {
            type: "top-products",
            title: "Most selling products",
            subtitle: "Units sold and revenue",
            filters: ["top"],
          },
        },
        {
          label: "Low stock",
          props: {
            type: "low-stock",
            title: "Low stock report",
            subtitle: "Items at or below the low stock limit",
            monthFilter: false,
            filters: ["level"],
          },
        },
      ]}
    />
  );
}