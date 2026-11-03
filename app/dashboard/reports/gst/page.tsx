"use client";

import { ReportTabs } from "@/components/reports/ReportView";

export default function GstReportPage() {
  return (
    <ReportTabs
      tabs={[
        {
          label: "GST",
          props: {
            type: "gst",
            title: "GST report",
            subtitle: "Product wise tax collected on orders",
          },
        },
      ]}
    />
  );
}