"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputTestId?: string;
  showSuggestions?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  suggestionsTestId?: string;
  suggestionButtonTestIdPrefix?: string;
  "data-testid"?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  showSuggestions = false,
  suggestions = [],
  onSuggestionClick,
  "data-testid": dataTestId,
}: SearchInputProps) {
  return (
    <div
      className="p-4 border-b border-zinc-200 dark:border-zinc-800"
      data-testid={dataTestId}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600"
        data-testid={`${dataTestId}-input`}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-3" data-testid={`${dataTestId}-suggestions`}>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Did you mean:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                data-testid={`${dataTestId}-suggestion-${suggestion}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
