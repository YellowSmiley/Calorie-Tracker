import { trackEvent } from "@/app/components/analyticsEvents";
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";

interface NutritionLabelPhotoInputProps {
  onExtract: (data: Partial<Record<string, string>>) => void;
}

export default function NutritionLabelPhotoInput({
  onExtract,
}: NutritionLabelPhotoInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      // Convert base64 data URL to Blob
      function dataURLtoBlob(dataurl: string) {
        const arr = dataurl.split(","),
          mime = arr[0].match(/:(.*?);/)?.[1] || "image/png",
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
        return new Blob([u8arr], { type: mime });
      }
      const blob = dataURLtoBlob(base64);
      const imageUrl = URL.createObjectURL(blob);
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(imageUrl, "eng");
        setProduct(text);
        // Parse nutrition values from OCR text
        const nutrition: Partial<Record<string, string>> = {};
        // Simple regexes for UK nutrition label fields
        const fields: [key: keyof typeof nutrition, regex: RegExp][] = [
          ["calories", /(?:energy|calories)[^\d]*(\d{1,5})/i],
          ["protein", /protein[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
          ["carbs", /carbohydrate[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
          ["fat", /fat[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
          ["saturates", /saturates[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
          ["sugars", /sugars[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
          ["fibre", /fibre[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
          ["salt", /salt[^\d]*(\d{1,4}(?:\.\d{1,2})?)/i],
        ];
        for (const [key, regex] of fields) {
          const match = text.match(regex);
          if (match) nutrition[key] = match[1];
        }
        onExtract(nutrition);
      } catch (err) {
        // fallback: no extraction
        onExtract({});
        // Error handling for pixReadStream errors
        if (err) {
          setError("Something went wrong. Please try a different photo.");
        } else {
          setError("Failed to extract text from image. Please try again.");
        }
      }
      setLoading(false);
      URL.revokeObjectURL(imageUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }

  function handleTakePhoto() {
    fileInputRef.current?.click();
    trackEvent("nutrition_label_photo_input_take_photo_clicked", {
      // No personally identifiable information should be included in analytics events.
    });
  }

  return (
    <div className="w-full md:col-span-1">
      <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
        Upload or Take Photo of Nutrition Label
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div className="w-full">
        <button
          type="button"
          className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-3 py-2 text-black dark:text-zinc-50 mb-2 transition-colors"
          onClick={handleTakePhoto}
          disabled={loading}
        >
          {loading ? "Extracting..." : "Take Photo / Upload"}
        </button>
        {product && (
          <div className="mt-2 w-full text-green-600 dark:text-green-400 text-sm font-medium">
            Successfully extracted nutrition info! Please review and edit values
            as needed before submitting (may be inaccurate)
          </div>
        )}
        {error && (
          <div className="mt-2 w-full text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
