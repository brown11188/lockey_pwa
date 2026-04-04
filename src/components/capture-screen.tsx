"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { Camera as CameraIcon, Image as ImageIcon, SwitchCamera as SwitchCameraIcon } from "lucide-react";

// Lazy-load expense bottom sheet — only needed after photo capture
const ExpenseBottomSheet = dynamic(() => import("@/components/expense-bottom-sheet").then(m => ({ default: m.ExpenseBottomSheet })), { ssr: false });

export function CaptureScreen({ initialDateTime }: { initialDateTime?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");

  const queryDateTime = searchParams.get("dateTime") ?? initialDateTime ?? "";

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setError(t.capture.cameraDenied);
    }
  }, [facingMode, t.capture.cameraDenied]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      setError(t.capture.cameraNotReady);
      return;
    }
    // Downsample to 720×720 max for faster upload (~60-70% smaller than 1080)
    const srcSize = Math.min(vw, vh);
    const outSize = Math.min(srcSize, 720);
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (vw - srcSize) / 2;
    const sy = (vh - srcSize) / 2;
    ctx.drawImage(video, sx, sy, srcSize, srcSize, 0, 0, outSize, outSize);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedPreview(URL.createObjectURL(blob));
          setSheetOpen(true);
          stopCamera();
        }
      },
      "image/jpeg",
      0.7
    );
  }, [stopCamera, t.capture.cameraNotReady]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCapturedBlob(file);
      setCapturedPreview(URL.createObjectURL(file));
      setSheetOpen(true);
      stopCamera();
    },
    [stopCamera]
  );

  const toggleFacing = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [facingMode, cameraActive, startCamera]);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setCapturedBlob(null);
    setCapturedPreview(null);
    startCamera();
  }, [startCamera]);

  const handleSaved = useCallback(() => {
    setSheetOpen(false);
    setCapturedBlob(null);
    setCapturedPreview(null);
    stopCamera();
    router.push("/gallery");
  }, [stopCamera, router]);

  return (
    <div className="relative flex h-screen flex-col bg-gray-950">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center p-4 safe-top">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-black text-gray-950">
            L
          </div>
          <h1 className="text-lg font-bold text-white">Lockey</h1>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="absolute left-4 right-4 top-16 z-10 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Camera viewfinder */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="relative aspect-square w-full max-w-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
              <CameraIcon className="h-12 w-12 text-gray-600" />
              <p className="text-sm text-gray-500">{t.capture.cameraLoading}</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-4 top-4 h-8 w-8 rounded-tl-2xl border-l-2 border-t-2 border-amber-400/50" />
            <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-2xl border-r-2 border-t-2 border-amber-400/50" />
            <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-2xl border-b-2 border-l-2 border-amber-400/50" />
            <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-2xl border-b-2 border-r-2 border-amber-400/50" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 bg-gray-950 py-6 pb-28">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-all hover:bg-white/10"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <button
          type="button"
          onClick={capturePhoto}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:bg-amber-400 active:scale-90"
        >
          <CameraIcon className="h-8 w-8 text-gray-950" />
        </button>

        <button
          type="button"
          onClick={toggleFacing}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-all hover:bg-white/10"
        >
          <SwitchCameraIcon className="h-5 w-5" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Post-capture bottom sheet */}
      {capturedBlob && capturedPreview && (
        <ExpenseBottomSheet
          open={sheetOpen}
          onClose={handleSheetClose}
          photoBlob={capturedBlob}
          photoPreview={capturedPreview}
          initialDateTime={queryDateTime || undefined}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
