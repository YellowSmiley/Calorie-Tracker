import { useRef, useState } from "react";
import Image from "next/image";
import Tesseract from "tesseract.js";

interface NutritionLabelPhotoInputProps {
  onExtract: (data: Partial<Record<string, string>>) => void;
}

export default function NutritionLabelPhotoInput({
  onExtract,
}: NutritionLabelPhotoInputProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
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
  }

  return (
    <div className="mb-4">
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
      <button
        type="button"
        className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 mb-2"
        onClick={handleTakePhoto}
        disabled={loading}
      >
        {loading ? "Extracting..." : "Take Photo / Upload"}
      </button>
      {image && (
        <div className="mt-2 max-w-xs rounded-lg border overflow-hidden">
          <Image
            src={image}
            alt="Nutrition Label"
            width={320}
            height={240}
            style={{ objectFit: "contain" }}
            className="rounded-lg"
            priority
          />
        </div>
      )}
      {error && (
        <div className="mt-2 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
