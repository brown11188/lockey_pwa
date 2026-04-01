/**
 * Client-side receipt amount extraction using Canvas + basic OCR patterns.
 * We use a lightweight approach: send the image to a server-side API that
 * uses basic image-to-text and regex extraction. No external APIs required.
 *
 * For the client-side fallback, we extract text from image using
 * a regex-based approach after the server returns extracted text.
 */

const PRICE_PATTERNS = [
  // Vietnamese receipt formats
  /T[OoÔô]?[\s]*[NGng]?[\s]*:?\s*([0-9]{1,3}(?:[.,][0-9]{3})+)/i,
  /TOTAL[:\s]+([0-9]{1,3}(?:[.,][0-9]{3})*)/i,
  /T[\u1ed4\u1ed5]NG[:\s]+([0-9]{1,3}(?:[.,][0-9]{3})*)/i,
  /GRAND\s*TOTAL[:\s]+([0-9]{1,3}(?:[.,][0-9]{3})*)/i,
  /TH[\u00c0\u00e0]NH\s*TI[\u1ec0\u1ec1]N[:\s]+([0-9]{1,3}(?:[.,][0-9]{3})*)/i,
  // Match amounts with VND/dong symbol
  /([0-9]{1,3}(?:\.[0-9]{3})+)(?:\s*(?:VND|VN[\u0110\u0111]|\u20AB|\u0111))/i,
  /([0-9]{1,3}(?:,[0-9]{3})+)(?:\s*(?:VND|VN[\u0110\u0111]|\u20AB|\u0111))/i,
  // USD patterns
  /\$\s*([0-9]+(?:\.[0-9]{1,2}))/,
  /USD\s*([0-9]+(?:\.[0-9]{1,2}))/i,
  // Fallback: any 5+ digit number (likely VND)
  /([0-9]{5,})/,
];

const KNOWN_SUBSCRIPTION_NAMES = [
  "Netflix", "Spotify", "YouTube", "Apple", "iCloud", "Adobe",
  "Notion", "ChatGPT", "Google One", "Disney", "HBO", "Canva",
  "GitHub", "Figma", "Slack", "Zoom", "Dropbox", "Microsoft",
  "Amazon", "Duolingo", "Claude", "Gym",
];

export interface OcrResult {
  amount: number | null;
  currency: "VND" | "USD" | null;
  rawText: string;
  confidence: "high" | "low" | null;
  detectedSubscription: string | null;
}

/**
 * Extract price from text using regex patterns
 */
export function extractAmountFromText(text: string): OcrResult {
  const result: OcrResult = {
    amount: null,
    currency: null,
    rawText: text,
    confidence: null,
    detectedSubscription: null,
  };

  // Check for subscription names
  const upperText = text.toUpperCase();
  for (const name of KNOWN_SUBSCRIPTION_NAMES) {
    if (upperText.includes(name.toUpperCase())) {
      result.detectedSubscription = name;
      break;
    }
  }

  // Try each pattern
  for (let i = 0; i < PRICE_PATTERNS.length; i++) {
    const match = text.match(PRICE_PATTERNS[i]);
    if (match?.[1]) {
      const rawVal = match[1];
      // Remove thousand separators and parse
      const cleaned = rawVal.replace(/[.,]/g, (char, idx, str) => {
        // If last separator has 2 digits after → decimal point (USD)
        const afterLast = str.substring(str.lastIndexOf(char) + 1);
        if (char === "." && afterLast.length <= 2 && idx === str.lastIndexOf(char)) {
          return ".";
        }
        return "";
      });

      const numericVal = parseFloat(cleaned);
      if (!isNaN(numericVal) && numericVal > 0) {
        result.amount = numericVal;
        // Determine currency
        if (text.match(/\$|USD/i)) {
          result.currency = "USD";
        } else {
          result.currency = numericVal >= 1000 ? "VND" : "USD";
        }
        result.confidence = i < 6 ? "high" : "low";
        break;
      }
    }
  }

  return result;
}

/**
 * Simple amount parser for Vietnamese price strings
 */
export function parseVietnamesePrice(str: string): number | null {
  // Remove dots (thousand separators in VND)
  const cleaned = str.replace(/\./g, "").replace(/,/g, "").replace(/[^0-9]/g, "");
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? null : val;
}
