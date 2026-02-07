-- Update existing users with old volumeUnit='cup' to 'ml'
UPDATE "User" SET "volumeUnit" = 'ml' WHERE "volumeUnit" = 'cup';
