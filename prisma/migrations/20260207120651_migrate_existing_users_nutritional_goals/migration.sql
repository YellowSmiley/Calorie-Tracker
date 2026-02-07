-- Update existing users with old default goals to new defaults
UPDATE "User" 
SET 
  "calorieGoal" = 3000,
  "carbGoal" = 410,
  "fatGoal" = 83
WHERE 
  "calorieGoal" = 2000 
  AND "carbGoal" = 250 
  AND "fatGoal" = 65
  AND "proteinGoal" = 150;
