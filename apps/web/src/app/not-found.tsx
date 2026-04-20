import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="mt-2 text-text-secondary">Page not found</p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-text-secondary hover:text-text underline"
        >
          Back to catalog
        </Link>
      </div>
    </div>
  );
}
