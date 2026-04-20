const LETTERS_REGEX = /[A-Za-z]/g;
const WORD_START_REGEX = /(^|[\s\-_/([{"'])([a-z])/g;

export function formatFoodNameForDisplay(name: string): string {
  const letters = name.match(LETTERS_REGEX);
  if (!letters) {
    return name;
  }

  const alphaOnly = letters.join("");
  const isAllLower = alphaOnly === alphaOnly.toLowerCase();
  const isAllUpper = alphaOnly === alphaOnly.toUpperCase();

  if (!isAllLower && !isAllUpper) {
    return name;
  }

  return name
    .toLowerCase()
    .replace(WORD_START_REGEX, (_, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
}
