export default async function TableLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cafeSlug: string; tableId: string }>;
}) {
  return (
    <>
      {children}
    </>
  );
}