import { useMemo, useState } from "react";
import HelpButton from "@/app/components/HelpButton";
import {
  ActivityLevel,
  calculateMicronutrientLimitsFromCalories,
  calculateGoalRecommendations,
  calculateGoalRecommendationsFromCalories,
  getCustomCalorieGoalValidationError,
  getGoalCalculatorValidationError,
  GoalType,
  SexType,
  WeightChangePace,
} from "@/lib/goalsCalculator";
import {
  convertBodyWeightForDisplay,
  convertBodyWeightFromInput,
  convertCaloriesFromInput,
  convertCaloriesForDisplay,
  convertHeightCmToFeetInches,
  convertHeightFeetInchesToCm,
  convertWeightForDisplay,
} from "@/lib/unitConversions";
import {
  AcceptedBodyWeightUnits,
  AcceptedCalorieUnits,
  AcceptedWeightedUnits,
} from "../types";
import { trackEvent } from "@/app/components/analyticsEvents";

interface GoalRecommendations {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  saturatesGoal: number;
  sugarsGoal: number;
  fibreGoal: number;
  saltGoal: number;
}

interface GoalsCalculatorSectionProps {
  calorieUnit: AcceptedCalorieUnits;
  weightUnit: AcceptedWeightedUnits;
  bodyWeightUnit: AcceptedBodyWeightUnits;
  onApplyGoals: (goals: GoalRecommendations) => void;
}

type HeightInputUnit = "cm" | "ft-in";
type CalculatorMethod = "profile" | "custom-calories";

export default function GoalsCalculatorSection({
  calorieUnit,
  weightUnit,
  bodyWeightUnit,
  onApplyGoals,
}: GoalsCalculatorSectionProps) {
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(170);
  const [calculatorMethod, setCalculatorMethod] =
    useState<CalculatorMethod>("profile");
  const [customCaloriesKcal, setCustomCaloriesKcal] = useState(2000);
  const [heightInputUnit, setHeightInputUnit] = useState<HeightInputUnit>(
    bodyWeightUnit === "lbs" ? "ft-in" : "cm",
  );
  const [weightKg, setWeightKg] = useState(70);
  const [sex, setSex] = useState<SexType>("male");
  const [goal, setGoal] = useState<GoalType>("maintain");
  const [weightChangePace, setWeightChangePace] =
    useState<WeightChangePace>("normal");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const displayedBodyWeight = useMemo(
    () =>
      Number(convertBodyWeightForDisplay(weightKg, bodyWeightUnit).toFixed(1)),
    [weightKg, bodyWeightUnit],
  );

  const displayedHeightFeetInches = useMemo(
    () => convertHeightCmToFeetInches(heightCm),
    [heightCm],
  );

  const displayedCustomCalories = useMemo(
    () =>
      Math.round(convertCaloriesForDisplay(customCaloriesKcal, calorieUnit)),
    [customCaloriesKcal, calorieUnit],
  );

  const mildRateLabel =
    bodyWeightUnit === "lbs" ? "Mild (0.6 lbs/week)" : "Mild (0.25 kg/week)";
  const normalRateLabel =
    bodyWeightUnit === "lbs" ? "Normal (1.1 lbs/week)" : "Normal (0.5 kg/week)";
  const highRateLabel =
    bodyWeightUnit === "lbs" ? "High (1.7 lbs/week)" : "High (0.75 kg/week)";
  const extremeRateLabel =
    bodyWeightUnit === "lbs"
      ? "Extreme (2.2 lbs/week)"
      : "Extreme (1.0 kg/week)";

  const calculateGoals = () => {
    const recommendations =
      calculatorMethod === "profile"
        ? (() => {
            const input = {
              age,
              heightCm,
              weightKg,
              sex,
              goal,
              activity,
              weightChangePace,
            };

            const validationError = getGoalCalculatorValidationError(input);
            if (validationError) {
              setError(validationError);
              setStatusMessage("");
              return null;
            }

            return calculateGoalRecommendations(input);
          })()
        : (() => {
            const input = {
              calorieTargetKcal: customCaloriesKcal,
              weightKg,
              goal,
            };

            const validationError = getCustomCalorieGoalValidationError(input);
            if (validationError) {
              setError(validationError);
              setStatusMessage("");
              return null;
            }

            return calculateGoalRecommendationsFromCalories(input);
          })();

    setError(null);

    if (!recommendations) {
      setError("Unable to calculate goals.");
      setStatusMessage("");
      return;
    }

    const derivedLimits = calculateMicronutrientLimitsFromCalories(
      recommendations.calorieTargetKcal,
    );

    onApplyGoals({
      calorieGoal: convertCaloriesForDisplay(
        recommendations.calorieTargetKcal,
        calorieUnit,
      ),
      proteinGoal: convertWeightForDisplay(
        recommendations.proteinGrams,
        weightUnit,
      ),
      carbGoal: convertWeightForDisplay(recommendations.carbGrams, weightUnit),
      fatGoal: convertWeightForDisplay(recommendations.fatGrams, weightUnit),
      saturatesGoal: convertWeightForDisplay(
        derivedLimits.saturatesGrams,
        weightUnit,
      ),
      sugarsGoal: convertWeightForDisplay(
        derivedLimits.sugarsGrams,
        weightUnit,
      ),
      fibreGoal: convertWeightForDisplay(derivedLimits.fibreGrams, weightUnit),
      saltGoal: convertWeightForDisplay(derivedLimits.saltGrams, weightUnit),
    });
    setStatusMessage("Goals applied. Save Settings to keep these values.");
    trackEvent("goals_calculated", {
      method: calculatorMethod,
    });
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Goal Calculator
        </h2>
        <HelpButton
          title="Goal Calculator"
          ariaLabel="Help: Goal calculator usage"
        >
          <p>How this is calculated:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Choose Profile-based to estimate calories from age, height, body
              weight, sex, activity, and goal.
            </li>
            <li>
              Choose Custom calories to set your own calorie target, then we
              estimate macros from that target, your body weight, and goal.
            </li>
            <li>
              We estimate BMR from age, height, body weight, and sex using a
              standard equation.
            </li>
            <li>
              Height can be entered as cm or ft/in and is converted to metric
              for calculation.
            </li>
            <li>
              We multiply BMR by activity level to estimate maintenance
              calories.
            </li>
            <li>
              We adjust calories by goal. Lose/Gain uses your selected pace
              (mild 0.25 kg/week, normal 0.5 kg/week, high 0.75 kg/week, or
              extreme 1.0 kg/week).
            </li>
            <li>
              We split macros using fixed ratios plus a protein target based on
              body weight.
            </li>
          </ul>
          <p>
            We always estimate saturates, sugars, fibre, and salt using
            calorie-based guidelines: saturates about 10% of calories, sugars
            about 10%, fibre about 14g per 1000 kcal, and salt 6g/day.
          </p>
          <p>
            Values are starting estimates. Adjust based on progress and
            professional advice.
          </p>
        </HelpButton>
      </div>

      <p
        id="goal-calculator-hint"
        className="mb-4 text-sm text-zinc-600 dark:text-zinc-400"
      >
        Use Profile-based or Custom calories as a starting point. You can
        fine-tune values after tracking for a week or two.
      </p>

      <fieldset aria-describedby="goal-calculator-hint" className="space-y-4">
        <legend className="sr-only">Goal calculator inputs</legend>

        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => {
              setCalculatorMethod("profile");
              setError(null);
              setStatusMessage("");
            }}
            className={`rounded-md px-3 py-1 text-sm ${
              calculatorMethod === "profile"
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
            aria-pressed={calculatorMethod === "profile"}
            data-testid="goal-calc-method-profile"
          >
            Profile-based
          </button>
          <button
            type="button"
            onClick={() => {
              setCalculatorMethod("custom-calories");
              setError(null);
              setStatusMessage("");
            }}
            className={`rounded-md px-3 py-1 text-sm ${
              calculatorMethod === "custom-calories"
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
            aria-pressed={calculatorMethod === "custom-calories"}
            data-testid="goal-calc-method-custom"
          >
            Custom calories
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {calculatorMethod === "custom-calories" ? (
            <div>
              <label
                htmlFor="goal-calc-custom-calories"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Custom calorie target ({calorieUnit})
              </label>
              <input
                id="goal-calc-custom-calories"
                type="number"
                min={Math.round(convertCaloriesForDisplay(1200, calorieUnit))}
                max={Math.round(convertCaloriesForDisplay(10000, calorieUnit))}
                step={1}
                value={displayedCustomCalories}
                onChange={(event) =>
                  setCustomCaloriesKcal(
                    convertCaloriesFromInput(
                      Number(event.target.value),
                      calorieUnit,
                    ),
                  )
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                data-testid="goal-calc-custom-calories"
              />
            </div>
          ) : null}

          {calculatorMethod === "profile" ? (
            <>
              <div>
                <label
                  htmlFor="goal-calc-age"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Age
                </label>
                <input
                  id="goal-calc-age"
                  type="number"
                  min={13}
                  max={100}
                  value={age}
                  onChange={(event) => setAge(Number(event.target.value))}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="goal-calc-height"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Height
                  </label>
                  <select
                    id="goal-calc-height-unit"
                    value={heightInputUnit}
                    onChange={(event) =>
                      setHeightInputUnit(event.target.value as HeightInputUnit)
                    }
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                    aria-label="Height unit"
                  >
                    <option value="cm">cm</option>
                    <option value="ft-in">ft/in</option>
                  </select>
                </div>

                {heightInputUnit === "cm" ? (
                  <input
                    id="goal-calc-height"
                    type="number"
                    min={120}
                    max={240}
                    value={Number(heightCm.toFixed(1))}
                    onChange={(event) =>
                      setHeightCm(Number(event.target.value))
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="goal-calc-height-feet"
                        className="sr-only"
                      >
                        Height feet
                      </label>
                      <input
                        id="goal-calc-height-feet"
                        type="number"
                        min={3}
                        max={8}
                        step="1"
                        value={displayedHeightFeetInches.feet}
                        onChange={(event) =>
                          setHeightCm(
                            convertHeightFeetInchesToCm(
                              Number(event.target.value),
                              displayedHeightFeetInches.inches,
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                        aria-label="Height feet"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="goal-calc-height-inches"
                        className="sr-only"
                      >
                        Height inches
                      </label>
                      <input
                        id="goal-calc-height-inches"
                        type="number"
                        min={0}
                        max={11.9}
                        step="0.1"
                        value={displayedHeightFeetInches.inches}
                        onChange={(event) =>
                          setHeightCm(
                            convertHeightFeetInchesToCm(
                              displayedHeightFeetInches.feet,
                              Number(event.target.value),
                            ),
                          )
                        }
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                        aria-label="Height inches"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}

          <div>
            <label
              htmlFor="goal-calc-weight"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Current Weight ({bodyWeightUnit})
            </label>
            <input
              id="goal-calc-weight"
              type="number"
              min={bodyWeightUnit === "lbs" ? 66 : 30}
              max={bodyWeightUnit === "lbs" ? 661 : 300}
              step="0.1"
              value={displayedBodyWeight}
              onChange={(event) =>
                setWeightKg(
                  convertBodyWeightFromInput(
                    Number(event.target.value),
                    bodyWeightUnit,
                  ),
                )
              }
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
            />
          </div>

          {calculatorMethod === "custom-calories" ? (
            <div>
              <label
                htmlFor="goal-calc-goal"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Goal
              </label>
              <select
                id="goal-calc-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value as GoalType)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
              >
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain weight</option>
                <option value="gain">Gain weight</option>
                <option value="muscle">Gain muscle</option>
              </select>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {calculatorMethod === "profile" ? (
            <>
              <div>
                <label
                  htmlFor="goal-calc-sex"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Sex
                </label>
                <select
                  id="goal-calc-sex"
                  value={sex}
                  onChange={(event) => setSex(event.target.value as SexType)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="goal-calc-activity"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Activity level
                </label>
                <select
                  id="goal-calc-activity"
                  value={activity}
                  onChange={(event) =>
                    setActivity(event.target.value as ActivityLevel)
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
                >
                  <option value="sedentary">Sedentary (little exercise)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="very">Very active (6-7 days/week)</option>
                </select>
              </div>
            </>
          ) : null}

          {calculatorMethod === "profile" ? (
            <div>
              <label
                htmlFor="goal-calc-goal"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Goal
              </label>
              <select
                id="goal-calc-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value as GoalType)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
              >
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain weight</option>
                <option value="gain">Gain weight</option>
                <option value="muscle">Gain muscle</option>
              </select>
            </div>
          ) : null}
        </div>

        {calculatorMethod === "profile" &&
        (goal === "lose" || goal === "gain") ? (
          <div className="max-w-sm">
            <label
              htmlFor="goal-calc-rate"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Weekly rate
            </label>
            <select
              id="goal-calc-rate"
              value={weightChangePace}
              onChange={(event) =>
                setWeightChangePace(event.target.value as WeightChangePace)
              }
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-600"
            >
              <option value="mild">{mildRateLabel}</option>
              <option value="normal">{normalRateLabel}</option>
              <option value="high">{highRateLabel}</option>
              <option value="extreme">{extremeRateLabel}</option>
            </select>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={calculateGoals}
            className="ct-button-primary h-10 rounded-lg px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
            data-testid="goal-calculator-calculate"
          >
            Calculate and apply goals
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Saturates, sugars, fibre, and salt are automatically estimated from
          your calorie target using guideline values.
        </p>
      </fieldset>

      {error ? (
        <p
          className="mt-3 text-sm text-zinc-700 dark:text-zinc-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {statusMessage ? (
        <p
          className="mt-3 text-sm text-zinc-700 dark:text-zinc-300"
          role="status"
          aria-live="polite"
          data-testid="goal-calculator-status"
        >
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
