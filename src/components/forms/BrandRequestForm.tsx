import { useState } from "react";
import { FormLayout } from "./FormLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { submitRequest } from "../../utils/api";

interface BrandRequestFormProps {
  onBack?: () => void;
  onCategoryChange?: (category: "brand" | "website" | "product") => void;
  initialRequestType?: string;
}

export function BrandRequestForm({ onBack, onCategoryChange, initialRequestType }: BrandRequestFormProps) {
  // Map the display text to the internal value
  const getInitialValue = () => {
    if (!initialRequestType) return "new-brand";
    
    const mapping: Record<string, string> = {
      "New asset": "new-asset",
      "New brand": "new-brand"
    };
    
    return mapping[initialRequestType] || "new-brand";
  };
  
  const [requestType, setRequestType] = useState(getInitialValue());
  const [assetType, setAssetType] = useState("");
  const [format, setFormat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [audience, setAudience] = useState("");
  const [brandStyle, setBrandStyle] = useState("");
  const [assetTypeOther, setAssetTypeOther] = useState("");
  const [customFormat, setCustomFormat] = useState("");
  const [copywriting, setCopywriting] = useState("");
  const [reference1, setReference1] = useState("");
  const [reference2, setReference2] = useState("");
  const [reference3, setReference3] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandName) {
      setError("Please enter a brand name");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      const requestData = {
        category: "brand" as const,
        title: requestType === "new-brand" 
          ? `New brand identity for ${brandName}`
          : `${assetType === "other" ? assetTypeOther : assetType} for ${brandName}`,
        requestType: requestType === "new-brand" ? "New brand" : "New asset",
        brandName,
        ...(requestType === "new-brand" && {
          tagline,
          audience,
          brandStyle,
        }),
        ...(requestType === "new-asset" && {
          assetType: assetType === "other" ? assetTypeOther : assetType,
          format: format === "custom" ? customFormat : format,
          copywriting,
        }),
        references: [reference1, reference2, reference3].filter(Boolean),
        notes,
      };

      console.log('🔵 BrandRequestForm: Submitting request', requestData);
      await submitRequest(requestData);
      setSuccess(true);
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (err: any) {
      console.error('❌ BrandRequestForm: Submit error:', err);
      
      // Show user-friendly error messages
      if (err.message.includes('Not authenticated') || err.message.includes('please log in')) {
        setError("You need to be logged in to submit a request. Please refresh the page and log in.");
      } else if (err.message.includes('Session expired')) {
        setError("Your session has expired. Please log out and log in again.");
      } else {
        setError(err.message || "Failed to submit request. Check the browser console for details.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormLayout
      title="Brand Request"
      subtitle="Create or improve your brand visuals"
      activeCategory="brand"
      onBack={onBack}
      onCategoryChange={onCategoryChange}
    >
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Request Type - Prominent Design */}
        <div className="space-y-4 bg-[#F9F9FB] p-6 rounded-[16px] border-2 border-[rgba(0,0,0,0.06)]">
          <div>
            <Label className="text-[#111111]">Request Type</Label>
            <p className="text-sm text-[rgba(0,0,0,0.6)] mt-1">Choose what you need</p>
          </div>
          <RadioGroup value={requestType} onValueChange={setRequestType}>
            <div className="space-y-3">
              <label 
                htmlFor="new-asset"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "new-asset" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="new-asset" id="new-asset" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">New asset</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">48 - 72h</span>
                </div>
              </label>
              <label 
                htmlFor="new-brand"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "new-brand" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="new-brand" id="new-brand" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">New brand</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">1 - 2 weeks</span>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Brand Name - Common for both */}
        <div className="space-y-3">
          <Label htmlFor="brand-name-common" className="text-[#111111]">Brand Name</Label>
          <Input
            id="brand-name-common"
            placeholder="Your brand name"
            className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </div>

        {/* Conditional Fields for New Brand */}
        {requestType === "new-brand" && (
          <>
            <div className="space-y-3">
              <Label htmlFor="tagline" className="text-[#111111]">Tagline</Label>
              <Input
                id="tagline"
                placeholder="Your brand's tagline or slogan"
                className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="audience" className="text-[#111111]">Target Audience</Label>
              <Textarea
                id="audience"
                placeholder="Describe who your brand is for"
                className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="brand-style" className="text-[#111111]">Brand Style</Label>
              <Textarea
                id="brand-style"
                placeholder="Describe your brand personality (e.g., modern, playful, professional, bold)"
                className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
                value={brandStyle}
                onChange={(e) => setBrandStyle(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Conditional Fields for New Asset */}
        {requestType === "new-asset" && (
          <>
            <div className="space-y-3">
              <Label htmlFor="asset-type" className="text-[#111111]">What is the asset?</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger className="rounded-[12px] border-[rgba(0,0,0,0.06)]">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="pitch-deck">Pitch Deck</SelectItem>
                  <SelectItem value="menu">Menu</SelectItem>
                  <SelectItem value="app-store-kit">App Store Kit</SelectItem>
                  <SelectItem value="social-media">Social Media Graphics</SelectItem>
                  <SelectItem value="business-card">Business Card</SelectItem>
                  <SelectItem value="brochure">Brochure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {assetType === "other" && (
                <Input
                  placeholder="Please specify the asset type"
                  className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
                  value={assetTypeOther}
                  onChange={(e) => setAssetTypeOther(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="format" className="text-[#111111]">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="rounded-[12px] border-[rgba(0,0,0,0.06)]">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter (US)</SelectItem>
                  <SelectItem value="1080x1920">1080x1920 (Instagram Story)</SelectItem>
                  <SelectItem value="1200x628">1200x628 (Facebook)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {format === "custom" && (
                <Input
                  placeholder="Please specify custom format (e.g., 1920x1080)"
                  className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="copywriting" className="text-[#111111]">Copywriting</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">What text or copy should be included in this asset?</p>
              <Textarea
                id="copywriting"
                placeholder="Provide the copy, headlines, body text, or key messaging for this asset"
                className="rounded-[12px] min-h-[120px] border-[rgba(0,0,0,0.06)]"
                value={copywriting}
                onChange={(e) => setCopywriting(e.target.value)}
              />
            </div>
          </>
        )}

        {/* References */}
        <div className="space-y-3">
          <Label className="text-[#111111]">References</Label>
          <p className="text-sm text-[rgba(0,0,0,0.6)]">Add links or descriptions of visual references</p>
          <div className="space-y-2">
            <Input placeholder="Reference link 1" className="rounded-[12px] border-[rgba(0,0,0,0.06)]" value={reference1} onChange={(e) => setReference1(e.target.value)} />
            <Input placeholder="Reference link 2" className="rounded-[12px] border-[rgba(0,0,0,0.06)]" value={reference2} onChange={(e) => setReference2(e.target.value)} />
            <Input placeholder="Reference link 3" className="rounded-[12px] border-[rgba(0,0,0,0.06)]" value={reference3} onChange={(e) => setReference3(e.target.value)} />
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-3">
          <Label className="text-[#111111]">Upload Existing Materials</Label>
          <p className="text-sm text-[rgba(0,0,0,0.6)]">Logo, photos, copy, or other relevant files</p>
          <div className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-[16px] p-8 text-center hover:border-[rgba(0,0,0,0.2)] transition-colors cursor-pointer bg-[#F9F9FB]">
            <Upload className="w-8 h-8 text-[rgba(0,0,0,0.35)] mx-auto mb-3" />
            <p className="text-[rgba(0,0,0,0.6)] mb-1">Drag and drop files here</p>
            <p className="text-sm text-[rgba(0,0,0,0.35)]">or click to browse</p>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-[#111111]">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any other details we should know?"
            className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="pt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-[12px] text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {success ? (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-[12px] text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>Request submitted successfully! Redirecting...</span>
            </div>
          ) : (
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </div>
      </form>
    </FormLayout>
  );
}