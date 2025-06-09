import { Link } from "react-router-dom";
import CenteredCardLayout from "./components/CenteredCardLayout";

export default function NotFoundPage() {
  return (
    <CenteredCardLayout>
      <h1 className="text-2xl font-bold mb-4 text-sky-700">404 - Not Found</h1>
      <p className="mb-6 text-gray-600">The page you are looking for does not exist.</p>
      <Link to="/" className="text-sky-600 underline">Go to Home</Link>
    </CenteredCardLayout>
  );
}
