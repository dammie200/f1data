export function Lightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.999 5a7 7 0 00-4 12.74V20a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 5z" />
    </svg>
  );
}

export function Flag({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h2l1 4 4-4 2 6 4-3v10H4z" />
    </svg>
  );
}
