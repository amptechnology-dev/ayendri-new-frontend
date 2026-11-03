"use client";

import DashboardLayout from "@/components/Layout"


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  children,
}) => {

  return (
    <>
      <link href="/css/app.css" rel="stylesheet" precedence="default" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet" precedence="default" />
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </>
  );
};

export default Layout;