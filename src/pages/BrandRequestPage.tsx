import { BrandRequestForm } from "../components/forms/BrandRequestForm";
import { Navigation } from "../components/Navigation";

export function BrandRequestPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <BrandRequestForm />
    </div>
  );
}
