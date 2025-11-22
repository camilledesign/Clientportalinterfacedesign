import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

interface FormLayoutProps {
  title: string;
  subtitle: string;
  activeCategory: "website" | "brand" | "product";
  children: ReactNode;
  onBack?: () => void;
  onCategoryChange?: (category: "website" | "brand" | "product") => void;
}

export function FormLayout({ title, subtitle, activeCategory, children, onBack, onCategoryChange }: FormLayoutProps) {
  const categories = [
    { id: "brand" as const, label: "Brand" },
    { id: "website" as const, label: "Website" },
    { id: "product" as const, label: "Product" }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-8 -ml-3 hover:bg-white hover:text-[#111111] rounded-lg text-[#111111]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        {/* Category Switcher */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {categories.map((cat, index) => (
            <div key={cat.id} className="flex items-center">
              {onCategoryChange ? (
                <button
                  onClick={() => onCategoryChange(cat.id)}
                  className={`transition-colors ${
                    cat.id === activeCategory
                      ? "text-[#111111]"
                      : "text-[rgba(0,0,0,0.35)] hover:text-[rgba(0,0,0,0.6)]"
                  }`}
                >
                  {cat.label}
                </button>
              ) : (
                <span
                  className={`transition-colors ${
                    cat.id === activeCategory
                      ? "text-[#111111]"
                      : "text-[rgba(0,0,0,0.35)]"
                  }`}
                >
                  {cat.label}
                </span>
              )}
              {index < categories.length - 1 && (
                <span className="mx-3 text-[rgba(0,0,0,0.12)]">·</span>
              )}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[#111111] mb-2">{title}</h1>
          <p className="text-[rgba(0,0,0,0.6)]">{subtitle}</p>
        </div>

        {/* Form Content */}
        <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[24px] p-8 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          {children}
        </div>
      </div>
    </div>
  );
}