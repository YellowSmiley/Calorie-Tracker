interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({
  className = "h-4 w-4",
}: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`}
    />
  );
}
