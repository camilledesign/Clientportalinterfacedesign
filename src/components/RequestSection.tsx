import { useState } from "react";
import { Globe, Palette, Smartphone } from "lucide-react";
import { Button } from "./ui/button";

type Category = "website" | "brand" | "product" | null;
type FormView = "website-form" | "brand-form" | "product-form";

interface RequestSectionProps {
  onNavigateToForm: (formType: FormView, requestType: string) => void;
}

const categories = [
  {
    id: "brand",
    title: "Brand",
    description: "Logos, brand guidelines, and visual assets",
    icon: Palette,
    options: [
      { label: "New asset", time: "48 - 72h" },
      { label: "New brand", time: "1 - 2 weeks" }
    ]
  },
  {
    id: "website",
    title: "Website",
    description: "Website design and landing pages",
    icon: Globe,
    options: [
      { label: "New website", time: "1 - 2 weeks" },
      { label: "Create a new page", time: "48 - 72h" },
      { label: "Update a page", time: "24h" }
    ]
  },
  {
    id: "product",
    title: "Product",
    description: "App screens and user interfaces",
    icon: Smartphone,
    options: [
      { label: "New feature", time: "72h - 1 week" },
      { label: "Update screen", time: "24 - 48h" }
    ]
  }
];

export function RequestSection({ onNavigateToForm }: RequestSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleStartRequest = () => {
    if (selectedCategory && selectedOption) {
      onNavigateToForm(`${selectedCategory}-form` as FormView, selectedOption);
    }
  };

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-[#111111] mb-2">Create a New Request</h2>
        <p className="text-[rgba(0,0,0,0.6)]">
          Select a category to get started with your next project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                relative p-8 rounded-[24px] border transition-all text-left
                ${isSelected 
                  ? 'border-[#0071E3] bg-white shadow-[0_8px_20px_rgba(0,113,227,0.15)]' 
                  : 'border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]'
                }
              `}
            >
              <div className="space-y-5">
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-[#0071E3]' : 'bg-[#F5F5F7]'}
                `}>
                  <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-[#111111]'}`} />
                </div>

                <div>
                  <h3 className="text-[#111111] mb-4">{category.title}</h3>
                  <p className="text-[rgba(0,0,0,0.6)] mb-4">{category.description}</p>
                  
                  <div className="space-y-3">
                    {category.options.map((option) => {
                      const isOptionSelected = selectedOption === option.label;
                      return (
                        <label
                          key={option.label}
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                            ${isOptionSelected 
                              ? 'border-[#0071E3] bg-[#0071E3]' 
                              : 'border-[rgba(0,0,0,0.2)]'
                            }
                          `}>
                            {isOptionSelected && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                          <input
                            type="radio"
                            name="request-option"
                            checked={isOptionSelected}
                            onChange={() => {
                              setSelectedCategory(category.id);
                              setSelectedOption(option.label);
                            }}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <span className={`transition-colors ${
                              isOptionSelected ? 'text-[#111111]' : 'text-[rgba(0,0,0,0.6)]'
                            }`}>
                              {option.label}
                            </span>
                            <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full ml-2">
                              {option.time}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[rgba(0,0,0,0.6)] text-center">
        If you need something else,{" "}
        <a 
          href="https://cal.com/camille-haidar/15min" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0071E3] hover:text-[#0077ED] transition-colors"
        >
          book a call
        </a>
      </p>

      <div className="flex justify-end">
        <Button 
          size="lg"
          disabled={!selectedOption}
          onClick={handleStartRequest}
          className="px-8 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] disabled:opacity-40"
        >
          Start a Request →
        </Button>
      </div>
    </section>
  );
}