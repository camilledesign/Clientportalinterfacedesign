import { ProductRequestForm } from "../components/forms/ProductRequestForm";
import { Navigation } from "../components/Navigation";

export function ProductRequestPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <ProductRequestForm />
    </div>
  );
}
