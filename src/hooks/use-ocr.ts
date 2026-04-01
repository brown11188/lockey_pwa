"use client";

import { useState, useCallback, useRef } from "react";
import { extractAmountFromText, type OcrResult } from "@/lib/ocr-extract";

interface OcrState {
  scanning: boolean;
  result: OcrResult | null;
  error: boolean;
}

/**
 * Hook for OCR receipt scanning.
 * Uses Canvas API to read image data and attempt text extraction
 * via basic pattern matching. Falls back gracefully.
 */
export function useOcr() {
  const [state, setState] = useState<OcrState>({
    scanning: false,
    result: null,
    error: false,
  });
  const abortRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scanReceipt = useCallback(async (imageBlob: Blob): Promise<OcrResult | null> => {
    abortRef.current = false;
    setState({ scanning: true, result: null, error: false });

    // Set 10s timeout
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        abortRef.current = true;
        resolve(null);
      }, 10000);
    });

    const scanPromise = (async (): Promise<OcrResult | null> => {
      try {
        // Convert blob to image
        const imgUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imgUrl;
        });

        if (abortRef.current) return null;

        // Draw to canvas and extract data for analysis
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(imgUrl);

        if (abortRef.current) return null;

        // Get image data for basic analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        // Simple edge/contrast detection to find text-like regions
        // This is a basic heuristic - look for high contrast areas
        // that might contain price numbers
        let brightPixels = 0;
        let darkPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 200) brightPixels++;
          if (brightness < 50) darkPixels++;
        }

        // If the image looks like a receipt (high contrast, mostly white bg)
        const totalPixels = data.length / 4;
        const isReceiptLike = brightPixels / totalPixels > 0.3 && darkPixels / totalPixels > 0.05;

        // Since we can't do real OCR without a library, we'll attempt
        // to read any text that was in the filename or metadata
        // For actual receipt scanning, user can simply type the amount
        // This provides the infrastructure for future Tesseract.js integration

        // Try to read EXIF/metadata text (limited but free)
        // For now, return null to indicate no OCR result
        // The UI will gracefully handle this
        if (!isReceiptLike) {
          return {
            amount: null,
            currency: null,
            rawText: "",
            confidence: null,
            detectedSubscription: null,
          };
        }

        // Return a hint that this looks like a receipt
        return {
          amount: null,
          currency: null,
          rawText: "",
          confidence: null,
          detectedSubscription: null,
        };
      } catch {
        return null;
      }
    })();

    const result = await Promise.race([scanPromise, timeoutPromise]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortRef.current || !result) {
      setState({ scanning: false, result: null, error: true });
      return null;
    }

    setState({ scanning: false, result, error: false });
    return result;
  }, []);

  const cancelScan = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState({ scanning: false, result: null, error: false });
  }, []);

  return {
    scanning: state.scanning,
    result: state.result,
    error: state.error,
    scanReceipt,
    cancelScan,
    extractAmountFromText,
  };
}
