import { WebsiteRequestForm } from "../components/forms/WebsiteRequestForm";
import { Navigation } from "../components/Navigation";

export function WebsiteRequestPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <WebsiteRequestForm />
    </div>
  );
}
