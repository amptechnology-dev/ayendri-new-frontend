export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="/css/app.css" rel="stylesheet" precedence="default" />
      {children}
    </>
  );
}