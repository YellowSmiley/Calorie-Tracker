"use client";

import { useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

interface BarcodeInputProps {
  onExtract: (data: Partial<Record<string, string>>) => void;
}

export default function BarcodeInput({ onExtract }: BarcodeInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchProduct(barcode: string) {
    setLoading(true);
    setProduct(null);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}`,
      );
      const data: Root = await res.json();
      if (data.product) {
        const p = data.product;
        setProduct(p);
        // Map Open Food Facts fields to CreateFoodSidebar fields
        const mapped = {
          name: p.product_name || "",
          calories: p.nutriments?.["energy-kcal_100g"]
            ? String(p.nutriments["energy-kcal_100g"])
            : "0",
          protein: p.nutriments?.proteins_100g
            ? String(p.nutriments.proteins_100g)
            : "0",
          carbs: p.nutriments?.carbohydrates_100g
            ? String(p.nutriments.carbohydrates_100g)
            : "00",
          fat: p.nutriments?.fat_100g ? String(p.nutriments.fat_100g) : "",
          // These are not always available, so leave blank if missing
          saturates: p.nutriments?.["saturated-fat_100g"]
            ? String(p.nutriments["saturated-fat_100g"])
            : "0",
          sugars: p.nutriments?.sugars_100g
            ? String(p.nutriments.sugars_100g)
            : "0",
          fibre: p.nutriments?.fiber_100g
            ? String(p.nutriments.fiber_100g)
            : "0",
          salt: p.nutriments?.salt_100g ? String(p.nutriments.salt_100g) : "",
        };
        onExtract(mapped);
      } else {
        setError("Product not found in Open Food Facts.");
      }
    } catch {
      setError("Failed to fetch product data.");
    }
    setLoading(false);
  }

  async function handleImageUpload(file: File) {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      // Create an image element to draw to canvas
      const img = new window.Image();
      img.onload = async () => {
        // Draw image to canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Could not process image");
          setLoading(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const codeReader = new BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageElement(img);
          fetchProduct(result.getText());
        } catch (err) {
          if (err instanceof NotFoundException) {
            setError("No barcode detected. Try a clearer photo.");
          } else {
            setError("Failed to process image. Try again.");
          }
        }
        setLoading(false);
      };
      img.onerror = () => {
        setError("Could not load image");
        setLoading(false);
      };
      img.src = base64;
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
    <div className="w-full md:col-span-1">
      <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
        Upload or Take Photo of Barcode
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
          {loading ? "Scanning..." : "Take Photo / Upload"}
        </button>
        {product && (
          <div className="mt-2 w-full text-green-600 dark:text-green-400 text-sm font-medium">
            Product found: {product.product_name}! Please review and edit values
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

export interface Root {
  code: string;
  product: Product;
  status: number;
  status_verbose: string;
}

export interface Product {
  _id: string;
  _keywords: string[];
  // added_countries_tags: any[];
  additives_n: number;
  // additives_original_tags: any[];
  // additives_tags: any[];
  allergens: string;
  allergens_from_ingredients: string;
  allergens_from_user: string;
  // allergens_hierarchy: any[];
  // allergens_tags: any[];
  // amino_acids_tags: any[];
  brands: string;
  brands_tags: string[];
  categories: string;
  categories_hierarchy: string[];
  categories_lc: string;
  categories_old: string;
  categories_properties: CategoriesProperties;
  categories_properties_tags: string[];
  categories_tags: string[];
  // checkers_tags: any[];
  code: string;
  codes_tags: string[];
  compared_to_category: string;
  complete: number;
  completeness: number;
  correctors_tags: string[];
  countries: string;
  countries_hierarchy: string[];
  countries_tags: string[];
  created_t: number;
  creator: string;
  // data_quality_bugs_tags: any[];
  data_quality_completeness_tags: string[];
  data_quality_dimensions: DataQualityDimensions;
  // data_quality_errors_tags: any[];
  data_quality_info_tags: string[];
  data_quality_tags: string[];
  data_quality_warnings_tags: string[];
  data_sources: string;
  data_sources_tags: string[];
  ecoscore_data: EcoscoreData;
  ecoscore_grade: string;
  ecoscore_score: number;
  ecoscore_tags: string[];
  editors_tags: string[];
  entry_dates_tags: string[];
  food_groups: string;
  food_groups_tags: string[];
  id: string;
  image_front_small_url: string;
  image_front_thumb_url: string;
  image_front_url: string;
  image_ingredients_small_url: string;
  image_ingredients_thumb_url: string;
  image_ingredients_url: string;
  image_nutrition_small_url: string;
  image_nutrition_thumb_url: string;
  image_nutrition_url: string;
  image_packaging_small_url: string;
  image_packaging_thumb_url: string;
  image_packaging_url: string;
  image_small_url: string;
  image_thumb_url: string;
  image_url: string;
  images: Images;
  informers_tags: string[];
  ingredients: Ingredient[];
  ingredients_analysis: IngredientsAnalysis;
  ingredients_analysis_tags: string[];
  ingredients_from_or_that_may_be_from_palm_oil_n: number;
  ingredients_from_palm_oil_n: number;
  // ingredients_from_palm_oil_tags: any[];
  ingredients_hierarchy: string[];
  ingredients_lc: string;
  ingredients_n: number;
  ingredients_n_tags: string[];
  ingredients_non_nutritive_sweeteners_n: number;
  ingredients_original_tags: string[];
  ingredients_percent_analysis: number;
  ingredients_sweeteners_n: number;
  ingredients_tags: string[];
  ingredients_text: string;
  ingredients_text_en: string;
  ingredients_text_with_allergens: string;
  ingredients_text_with_allergens_en: string;
  ingredients_that_may_be_from_palm_oil_n: number;
  // ingredients_that_may_be_from_palm_oil_tags: any[];
  ingredients_with_specified_percent_n: number;
  ingredients_with_specified_percent_sum: number;
  ingredients_with_unspecified_percent_n: number;
  ingredients_with_unspecified_percent_sum: number;
  ingredients_without_ciqual_codes: string[];
  ingredients_without_ciqual_codes_n: number;
  ingredients_without_ecobalyse_ids: string[];
  ingredients_without_ecobalyse_ids_n: number;
  interface_version_created: string;
  interface_version_modified: string;
  known_ingredients_n: number;
  labels: string;
  labels_hierarchy: string[];
  labels_lc: string;
  labels_old: string;
  labels_tags: string[];
  lang: string;
  languages: Languages;
  languages_codes: LanguagesCodes;
  languages_hierarchy: string[];
  languages_tags: string[];
  last_edit_dates_tags: string[];
  last_editor: string;
  last_image_dates_tags: string[];
  last_image_t: number;
  last_modified_by: string;
  last_modified_t: number;
  last_updated_t: number;
  lc: string;
  // main_countries_tags: any[];
  max_imgid: string;
  // minerals_tags: any[];
  misc_tags: string[];
  no_nutrition_data: string;
  nova_group_debug: string;
  nova_group_error: string;
  nova_groups_tags: string[];
  // nucleotides_tags: any[];
  nutrient_levels: NutrientLevels;
  nutrient_levels_tags: string[];
  nutriments: Nutriments;
  nutriscore: Nutriscore;
  nutriscore_2021_tags: string[];
  nutriscore_2023_tags: string[];
  nutriscore_data: NutriscoreData;
  nutriscore_grade: string;
  nutriscore_score: number;
  nutriscore_score_opposite: number;
  nutriscore_tags: string[];
  nutriscore_version: string;
  nutrition_data: string;
  nutrition_data_per: string;
  nutrition_data_prepared_per: string;
  nutrition_grade_fr: string;
  nutrition_grades: string;
  nutrition_grades_tags: string[];
  nutrition_score_beverage: number;
  nutrition_score_debug: string;
  nutrition_score_warning_fruits_vegetables_legumes_estimate_from_ingredients: number;
  nutrition_score_warning_fruits_vegetables_legumes_estimate_from_ingredients_value: number;
  nutrition_score_warning_fruits_vegetables_nuts_estimate_from_ingredients: number;
  nutrition_score_warning_fruits_vegetables_nuts_estimate_from_ingredients_value: number;
  // other_nutritional_substances_tags: any[];
  packaging: string;
  packaging_hierarchy: string[];
  packaging_lc: string;
  packaging_materials_tags: string[];
  packaging_old: string;
  // packaging_recycling_tags: any[];
  packaging_shapes_tags: string[];
  packaging_tags: string[];
  packagings: Packaging3[];
  // packagings_materials: PackagingsMaterials;
  packagings_n: number;
  photographers_tags: string[];
  pnns_groups_1: string;
  pnns_groups_1_tags: string[];
  pnns_groups_2: string;
  pnns_groups_2_tags: string[];
  popularity_key: number;
  popularity_tags: string[];
  product_name: string;
  product_name_en: string;
  product_quantity: number;
  product_quantity_unit: string;
  product_type: string;
  quantity: string;
  // removed_countries_tags: any[];
  rev: number;
  scans_n: number;
  schema_version: number;
  selected_images: SelectedImages;
  sortkey: number;
  states: string;
  states_hierarchy: string[];
  states_tags: string[];
  stores: string;
  stores_tags: string[];
  teams: string;
  teams_tags: string[];
  traces: string;
  traces_from_ingredients: string;
  traces_from_user: string;
  // traces_hierarchy: any[];
  // traces_tags: any[];
  unique_scans_n: number;
  unknown_ingredients_n: number;
  // unknown_nutrients_tags: any[];
  update_key: string;
  // vitamins_tags: any[];
  // weighers_tags: any[];
}

export interface CategoriesProperties {
  "agribalyse_proxy_food_code:en": string;
}

export interface DataQualityDimensions {
  accuracy: Accuracy;
  completeness: Completeness;
}

export interface Accuracy {
  overall: string;
}

export interface Completeness {
  general_information: string;
  ingredients: string;
  nutrition: string;
  overall: string;
  packaging: string;
}

export interface EcoscoreData {
  adjustments: Adjustments;
  agribalyse: Agribalyse;
  grade: string;
  grades: Grades;
  missing: Missing;
  missing_data_warning: number;
  score: number;
  scores: Scores;
  status: string;
}

export interface Adjustments {
  origins_of_ingredients: OriginsOfIngredients;
  packaging: Packaging;
  production_system: ProductionSystem;
}

export interface OriginsOfIngredients {
  aggregated_origins: AggregatedOrigin[];
  epi_score: number;
  epi_value: number;
  origins_from_categories: string[];
  origins_from_origins_field: string[];
  transportation_score: number;
  transportation_scores: TransportationScores;
  transportation_value: number;
  transportation_values: TransportationValues;
  value: number;
  values: Values;
  warning: string;
}

export interface AggregatedOrigin {
  epi_score: number;
  origin: string;
  percent: number;
  transportation_score: number;
}

export interface TransportationScores {
  ad: number;
  al: number;
  at: number;
  ax: number;
  ba: number;
  be: number;
  bg: number;
  ch: number;
  cy: number;
  cz: number;
  de: number;
  dk: number;
  dz: number;
  ee: number;
  eg: number;
  es: number;
  fi: number;
  fo: number;
  fr: number;
  gg: number;
  gi: number;
  gr: number;
  hr: number;
  hu: number;
  ie: number;
  il: number;
  im: number;
  is: number;
  it: number;
  je: number;
  lb: number;
  li: number;
  lt: number;
  lu: number;
  lv: number;
  ly: number;
  ma: number;
  mc: number;
  md: number;
  me: number;
  mk: number;
  mt: number;
  nl: number;
  no: number;
  pl: number;
  ps: number;
  pt: number;
  ro: number;
  rs: number;
  se: number;
  si: number;
  sj: number;
  sk: number;
  sm: number;
  sy: number;
  tn: number;
  tr: number;
  ua: number;
  uk: number;
  us: number;
  va: number;
  world: number;
  xk: number;
}

export interface TransportationValues {
  ad: number;
  al: number;
  at: number;
  ax: number;
  ba: number;
  be: number;
  bg: number;
  ch: number;
  cy: number;
  cz: number;
  de: number;
  dk: number;
  dz: number;
  ee: number;
  eg: number;
  es: number;
  fi: number;
  fo: number;
  fr: number;
  gg: number;
  gi: number;
  gr: number;
  hr: number;
  hu: number;
  ie: number;
  il: number;
  im: number;
  is: number;
  it: number;
  je: number;
  lb: number;
  li: number;
  lt: number;
  lu: number;
  lv: number;
  ly: number;
  ma: number;
  mc: number;
  md: number;
  me: number;
  mk: number;
  mt: number;
  nl: number;
  no: number;
  pl: number;
  ps: number;
  pt: number;
  ro: number;
  rs: number;
  se: number;
  si: number;
  sj: number;
  sk: number;
  sm: number;
  sy: number;
  tn: number;
  tr: number;
  ua: number;
  uk: number;
  us: number;
  va: number;
  world: number;
  xk: number;
}

export interface Values {
  ad: number;
  al: number;
  at: number;
  ax: number;
  ba: number;
  be: number;
  bg: number;
  ch: number;
  cy: number;
  cz: number;
  de: number;
  dk: number;
  dz: number;
  ee: number;
  eg: number;
  es: number;
  fi: number;
  fo: number;
  fr: number;
  gg: number;
  gi: number;
  gr: number;
  hr: number;
  hu: number;
  ie: number;
  il: number;
  im: number;
  is: number;
  it: number;
  je: number;
  lb: number;
  li: number;
  lt: number;
  lu: number;
  lv: number;
  ly: number;
  ma: number;
  mc: number;
  md: number;
  me: number;
  mk: number;
  mt: number;
  nl: number;
  no: number;
  pl: number;
  ps: number;
  pt: number;
  ro: number;
  rs: number;
  se: number;
  si: number;
  sj: number;
  sk: number;
  sm: number;
  sy: number;
  tn: number;
  tr: number;
  ua: number;
  uk: number;
  us: number;
  va: number;
  world: number;
  xk: number;
}

export interface Packaging {
  non_recyclable_and_non_biodegradable_materials: number;
  packagings: Packaging2[];
  score: number;
  value: number;
}

export interface Packaging2 {
  environmental_score_material_score: number;
  environmental_score_shape_ratio: number;
  food_contact: number;
  material: string;
  material_shape: string;
  non_recyclable_and_non_biodegradable: string;
  shape: string;
}

export interface ProductionSystem {
  // labels: any[];
  value: number;
  warning: string;
}

export interface Agribalyse {
  agribalyse_proxy_food_code: string;
  co2_agriculture: number;
  co2_consumption: number;
  co2_distribution: number;
  co2_packaging: number;
  co2_processing: number;
  co2_total: number;
  co2_transportation: number;
  code: string;
  dqr: string;
  ef_agriculture: number;
  ef_consumption: number;
  ef_distribution: number;
  ef_packaging: number;
  ef_processing: number;
  ef_total: number;
  ef_transportation: number;
  is_beverage: number;
  name_en: string;
  name_fr: string;
  score: number;
  version: string;
}

export interface Grades {
  ad: string;
  al: string;
  at: string;
  ax: string;
  ba: string;
  be: string;
  bg: string;
  ch: string;
  cy: string;
  cz: string;
  de: string;
  dk: string;
  dz: string;
  ee: string;
  eg: string;
  es: string;
  fi: string;
  fo: string;
  fr: string;
  gg: string;
  gi: string;
  gr: string;
  hr: string;
  hu: string;
  ie: string;
  il: string;
  im: string;
  is: string;
  it: string;
  je: string;
  lb: string;
  li: string;
  lt: string;
  lu: string;
  lv: string;
  ly: string;
  ma: string;
  mc: string;
  md: string;
  me: string;
  mk: string;
  mt: string;
  nl: string;
  no: string;
  pl: string;
  ps: string;
  pt: string;
  ro: string;
  rs: string;
  se: string;
  si: string;
  sj: string;
  sk: string;
  sm: string;
  sy: string;
  tn: string;
  tr: string;
  ua: string;
  uk: string;
  us: string;
  va: string;
  world: string;
  xk: string;
}

export interface Missing {
  labels: number;
  origins: number;
}

export interface Scores {
  ad: number;
  al: number;
  at: number;
  ax: number;
  ba: number;
  be: number;
  bg: number;
  ch: number;
  cy: number;
  cz: number;
  de: number;
  dk: number;
  dz: number;
  ee: number;
  eg: number;
  es: number;
  fi: number;
  fo: number;
  fr: number;
  gg: number;
  gi: number;
  gr: number;
  hr: number;
  hu: number;
  ie: number;
  il: number;
  im: number;
  is: number;
  it: number;
  je: number;
  lb: number;
  li: number;
  lt: number;
  lu: number;
  lv: number;
  ly: number;
  ma: number;
  mc: number;
  md: number;
  me: number;
  mk: number;
  mt: number;
  nl: number;
  no: number;
  pl: number;
  ps: number;
  pt: number;
  ro: number;
  rs: number;
  se: number;
  si: number;
  sj: number;
  sk: number;
  sm: number;
  sy: number;
  tn: number;
  tr: number;
  ua: number;
  uk: number;
  us: number;
  va: number;
  world: number;
  xk: number;
}

export interface Images {
  "1": N1;
  "2": N2;
  "3": N3;
  "4": N4;
  "5": N5;
  front_en: FrontEn;
  ingredients_en: IngredientsEn;
  nutrition_en: NutritionEn;
  packaging_en: PackagingEn;
}

export interface N1 {
  sizes: Sizes;
  uploaded_t: number;
  uploader: string;
}

export interface Sizes {
  "100": N100;
  "400": N400;
  full: Full;
}

export interface N100 {
  h: number;
  w: number;
}

export interface N400 {
  h: number;
  w: number;
}

export interface Full {
  h: number;
  w: number;
}

export interface N2 {
  sizes: Sizes2;
  uploaded_t: number;
  uploader: string;
}

export interface Sizes2 {
  "100": N1002;
  "400": N4002;
  full: Full2;
}

export interface N1002 {
  h: number;
  w: number;
}

export interface N4002 {
  h: number;
  w: number;
}

export interface Full2 {
  h: number;
  w: number;
}

export interface N3 {
  sizes: Sizes3;
  uploaded_t: number;
  uploader: string;
}

export interface Sizes3 {
  "100": N1003;
  "400": N4003;
  full: Full3;
}

export interface N1003 {
  h: number;
  w: number;
}

export interface N4003 {
  h: number;
  w: number;
}

export interface Full3 {
  h: number;
  w: number;
}

export interface N4 {
  sizes: Sizes4;
  uploaded_t: number;
  uploader: string;
}

export interface Sizes4 {
  "100": N1004;
  "400": N4004;
  full: Full4;
}

export interface N1004 {
  h: number;
  w: number;
}

export interface N4004 {
  h: number;
  w: number;
}

export interface Full4 {
  h: number;
  w: number;
}

export interface N5 {
  sizes: Sizes5;
  uploaded_t: number;
  uploader: string;
}

export interface Sizes5 {
  "100": N1005;
  "400": N4005;
  full: Full5;
}

export interface N1005 {
  h: number;
  w: number;
}

export interface N4005 {
  h: number;
  w: number;
}

export interface Full5 {
  h: number;
  w: number;
}

export interface FrontEn {
  imgid: string;
  rev: string;
  sizes: Sizes6;
}

export interface Sizes6 {
  "100": N1006;
  "200": N200;
  "400": N4006;
  full: Full6;
}

export interface N1006 {
  h: number;
  w: number;
}

export interface N200 {
  h: number;
  w: number;
}

export interface N4006 {
  h: number;
  w: number;
}

export interface Full6 {
  h: number;
  w: number;
}

export interface IngredientsEn {
  imgid: string;
  rev: string;
  sizes: Sizes7;
}

export interface Sizes7 {
  "100": N1007;
  "200": N2002;
  "400": N4007;
  full: Full7;
}

export interface N1007 {
  h: number;
  w: number;
}

export interface N2002 {
  h: number;
  w: number;
}

export interface N4007 {
  h: number;
  w: number;
}

export interface Full7 {
  h: number;
  w: number;
}

export interface NutritionEn {
  imgid: string;
  rev: string;
  sizes: Sizes8;
}

export interface Sizes8 {
  "100": N1008;
  "200": N2003;
  "400": N4008;
  full: Full8;
}

export interface N1008 {
  h: number;
  w: number;
}

export interface N2003 {
  h: number;
  w: number;
}

export interface N4008 {
  h: number;
  w: number;
}

export interface Full8 {
  h: number;
  w: number;
}

export interface PackagingEn {
  imgid: string;
  rev: string;
  sizes: Sizes9;
}

export interface Sizes9 {
  "100": N1009;
  "200": N2004;
  "400": N4009;
  full: Full9;
}

export interface N1009 {
  h: number;
  w: number;
}

export interface N2004 {
  h: number;
  w: number;
}

export interface N4009 {
  h: number;
  w: number;
}

export interface Full9 {
  h: number;
  w: number;
}

export interface Ingredient {
  id: string;
  is_in_taxonomy: number;
  percent_estimate: number;
  percent_max: number;
  percent_min: number;
  text: string;
}

export interface IngredientsAnalysis {
  "en:palm-oil-content-unknown": string[];
  "en:vegan-status-unknown": string[];
  "en:vegetarian-status-unknown": string[];
}

export interface Languages {
  "en:english": number;
}

export interface LanguagesCodes {
  en: number;
}

export interface NutrientLevels {
  fat: string;
  salt: string;
  "saturated-fat": string;
  sugars: string;
}

export interface Nutriments {
  calcium: number;
  calcium_100g: number;
  calcium_unit: string;
  calcium_value: number;
  carbohydrates: number;
  carbohydrates_100g: number;
  carbohydrates_unit: string;
  carbohydrates_value: number;
  energy: number;
  "energy-kcal": number;
  "energy-kcal_100g": number;
  "energy-kcal_unit": string;
  "energy-kcal_value": number;
  "energy-kcal_value_computed": number;
  energy_100g: number;
  energy_unit: string;
  energy_value: number;
  fat: number;
  fat_100g: number;
  fat_unit: string;
  fat_value: number;
  fiber: number;
  fiber_100g: number;
  fiber_unit: string;
  fiber_value: number;
  "fruits-vegetables-legumes-estimate-from-ingredients_100g": number;
  "fruits-vegetables-legumes-estimate-from-ingredients_serving": number;
  "fruits-vegetables-nuts-estimate-from-ingredients_100g": number;
  "fruits-vegetables-nuts-estimate-from-ingredients_serving": number;
  "nutrition-score-fr": number;
  "nutrition-score-fr_100g": number;
  proteins: number;
  proteins_100g: number;
  proteins_unit: string;
  proteins_value: number;
  salt: number;
  salt_100g: number;
  salt_unit: string;
  salt_value: number;
  "saturated-fat": number;
  "saturated-fat_100g": number;
  "saturated-fat_unit": string;
  "saturated-fat_value": number;
  sodium: number;
  sodium_100g: number;
  sodium_unit: string;
  sodium_value: number;
  sugars: number;
  sugars_100g: number;
  sugars_unit: string;
  sugars_value: number;
  "vitamin-b12": number;
  "vitamin-b12_100g": number;
  "vitamin-b12_unit": string;
  "vitamin-b12_value": number;
}

export interface Nutriscore {
  "2021": N2021;
  "2023": N2023;
}

export interface N2021 {
  category_available: number;
  data: Data;
  grade: string;
  nutrients_available: number;
  nutriscore_applicable: number;
  nutriscore_computed: number;
  score: number;
}

export interface Data {
  energy: number;
  energy_points: number;
  energy_value: number;
  fiber: number;
  fiber_points: number;
  fiber_value: number;
  fruits_vegetables_nuts_colza_walnut_olive_oils: number;
  fruits_vegetables_nuts_colza_walnut_olive_oils_points: number;
  fruits_vegetables_nuts_colza_walnut_olive_oils_value: number;
  is_beverage: number;
  is_cheese: number;
  is_fat: number;
  is_water: number;
  negative_points: number;
  positive_points: number;
  proteins: number;
  proteins_points: number;
  proteins_value: number;
  saturated_fat: number;
  saturated_fat_points: number;
  saturated_fat_value: number;
  sodium: number;
  sodium_points: number;
  sodium_value: number;
  sugars: number;
  sugars_points: number;
  sugars_value: number;
}

export interface N2023 {
  category_available: number;
  data: Data2;
  grade: string;
  nutrients_available: number;
  nutriscore_applicable: number;
  nutriscore_computed: number;
  score: number;
}

export interface Data2 {
  components: Components;
  count_proteins: number;
  count_proteins_reason: string;
  is_beverage: number;
  is_cheese: number;
  is_fat_oil_nuts_seeds: number;
  is_red_meat_product: number;
  is_water: number;
  negative_points: number;
  negative_points_max: number;
  positive_nutrients: string[];
  positive_points: number;
  positive_points_max: number;
}

export interface Components {
  negative: Negative[];
  positive: Positive[];
}

export interface Negative {
  id: string;
  points: number;
  points_max: number;
  unit: string;
  value: number;
}

export interface Positive {
  id: string;
  points: number;
  points_max: number;
  unit: string;
  value: number;
}

export interface NutriscoreData {
  components: Components2;
  count_proteins: number;
  count_proteins_reason: string;
  grade: string;
  is_beverage: number;
  is_cheese: number;
  is_fat_oil_nuts_seeds: number;
  is_red_meat_product: number;
  is_water: number;
  negative_points: number;
  negative_points_max: number;
  positive_nutrients: string[];
  positive_points: number;
  positive_points_max: number;
  score: number;
}

export interface Components2 {
  negative: Negative2[];
  positive: Positive2[];
}

export interface Negative2 {
  id: string;
  points: number;
  points_max: number;
  unit: string;
  value: number;
}

export interface Positive2 {
  id: string;
  points: number;
  points_max: number;
  unit: string;
  value: number;
}

export interface Packaging3 {
  food_contact: number;
  material: string;
  shape: string;
}

export interface SelectedImages {
  front: Front;
  ingredients: Ingredients;
  nutrition: Nutrition;
  packaging: Packaging4;
}

export interface Front {
  display: Display;
  small: Small;
  thumb: Thumb;
}

export interface Display {
  en: string;
}

export interface Small {
  en: string;
}

export interface Thumb {
  en: string;
}

export interface Ingredients {
  display: Display2;
  small: Small2;
  thumb: Thumb2;
}

export interface Display2 {
  en: string;
}

export interface Small2 {
  en: string;
}

export interface Thumb2 {
  en: string;
}

export interface Nutrition {
  display: Display3;
  small: Small3;
  thumb: Thumb3;
}

export interface Display3 {
  en: string;
}

export interface Small3 {
  en: string;
}

export interface Thumb3 {
  en: string;
}

export interface Packaging4 {
  display: Display4;
  small: Small4;
  thumb: Thumb4;
}

export interface Display4 {
  en: string;
}

export interface Small4 {
  en: string;
}

export interface Thumb4 {
  en: string;
}
