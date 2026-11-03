"use client";

import { ReportTabs } from "@/components/reports/ReportView";

export default function OrderReportPage() {
  return (
    <ReportTabs
      tabs={[
        {
          label: "All orders",
          props: {
            type: "orders",
            title: "Orders report",
            subtitle: "Orders received",
            filters: ["status"],
          },
        },
        {
          label: "Pending orders",
          props: {
            type: "pending-orders",
            title: "Pending orders report",
            subtitle: "Pending and confirmed orders, oldest first",
          },
        },
        {
          label: "Top customers",
          props: {
            type: "top-customers",
            title: "Top customers report",
            subtitle: "Customers with the most orders",
            filters: ["top"],
          },
        },
      ]}
    />
  );
}