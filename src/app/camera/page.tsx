import { CaptureScreen } from "@/components/capture-screen";

export default async function CameraPage({
  searchParams,
}: {
  searchParams: Promise<{ dateTime?: string }>;
}) {
  const { dateTime } = await searchParams;

  return <CaptureScreen initialDateTime={dateTime} />;
}
