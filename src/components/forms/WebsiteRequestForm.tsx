import { useState } from "react";
import { FormLayout } from "./FormLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Upload, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { submitRequest } from "../../utils/api";

interface WebsiteRequestFormProps {
  onBack?: () => void;
  onCategoryChange?: (category: "brand" | "website" | "product") => void;
  initialRequestType?: string;
}

export function WebsiteRequestForm({ onBack, onCategoryChange, initialRequestType }: WebsiteRequestFormProps) {
  // Map the display text to the internal value
  const getInitialValue = () => {
    if (!initialRequestType) return "new-website";
    
    const mapping: Record<string, string> = {
      "New website": "new-website",
      "Create a new page": "create-new-page",
      "Update a page": "update-page"
    };
    
    return mapping[initialRequestType] || "new-website";
  };
  
  const [requestType, setRequestType] = useState(getInitialValue());
  const [websiteType, setWebsiteType] = useState("landing-page");
  const [copyStatus, setCopyStatus] = useState("");
  const [needCopywriting, setNeedCopywriting] = useState(false);
  const [copyUploadMethod, setCopyUploadMethod] = useState<"file" | "link">("file");
  const [copyUpdateMethod, setCopyUpdateMethod] = useState<"file" | "link">("file");
  
  // Form field states
  const [pages, setPages] = useState("");
  const [goal, setGoal] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [pageName, setPageName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [updates, setUpdates] = useState("");
  const [reference1, setReference1] = useState("");
  const [reference2, setReference2] = useState("");
  const [reference3, setReference3] = useState("");
  const [notes, setNotes] = useState("");
  
  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError("");
      
      const getRequestTitle = () => {
        if (requestType === "new-website") {
          return `New ${websiteType === "landing-page" ? "landing page" : "multi-page website"}`;
        } else if (requestType === "create-new-page") {
          return `New page: ${pageName || "Untitled"}`;
        } else {
          return `Update page: ${pageUrl || "Untitled"}`;
        }
      };
      
      const requestData = {
        category: "Website",
        title: getRequestTitle(),
        brief: {
          requestType,
          category: "Website",
          ...(requestType === "new-website" && {
            websiteType,
            pages: pages.split("\n").filter(Boolean),
            goal,
            copyStatus,
            needCopywriting,
          }),
          ...(requestType === "create-new-page" && {
            websiteLink,
            pageName,
            purpose,
            copyStatus,
          }),
          ...(requestType === "update-page" && {
            pageUrl,
            updates,
            copyStatus,
          }),
          references: [reference1, reference2, reference3].filter(Boolean),
          notes,
        }
      };

      console.log('🔵 WebsiteRequestForm: Submitting request', requestData);
      await submitRequest(requestData);
      setSuccess(true);
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (err: any) {
      console.error('❌ WebsiteRequestForm: Submit error:', err);
      
      // Show user-friendly error messages
      if (err.message.includes('Not authenticated') || err.message.includes('please log in')) {
        setError("You need to be logged in to submit a request. Please refresh the page and log in.");
      } else {
        setError(err.message || "Failed to submit request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormLayout
      title="Website Request"
      subtitle="Tell us what you need for your website project"
      activeCategory="website"
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
                htmlFor="new-website"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "new-website" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="new-website" id="new-website" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">New website</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">1 - 2 weeks</span>
                </div>
              </label>
              <label 
                htmlFor="create-new-page"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "create-new-page" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="create-new-page" id="create-new-page" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">Create a new page</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">48 - 72h</span>
                </div>
              </label>
              <label 
                htmlFor="update-page"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "update-page" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="update-page" id="update-page" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">Update a page</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">24h</span>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* NEW WEBSITE FIELDS */}
        {requestType === "new-website" && (
          <>
            {/* Website Type */}
            <div className="space-y-3">
              <Label className="text-[#111111]">Website Type</Label>
              <RadioGroup value={websiteType} onValueChange={setWebsiteType}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="landing-page" id="landing-page" />
                    <Label htmlFor="landing-page" className="cursor-pointer flex-1 text-[#111111]">
                      Landing Page
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="multi-page" id="multi-page" />
                    <Label htmlFor="multi-page" className="cursor-pointer flex-1 text-[#111111]">
                      Multi-page Website
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Pages List - Only for Multi-page */}
            {websiteType === "multi-page" && (
              <div className="space-y-3">
                <Label htmlFor="pages" className="text-[#111111]">Pages Needed</Label>
                <p className="text-sm text-[rgba(0,0,0,0.6)]">List all pages you need (one per line)</p>
                <Textarea
                  id="pages"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="Home&#10;About&#10;Services&#10;Contact"
                  className="rounded-[12px] min-h-[120px] border-[rgba(0,0,0,0.06)]"
                />
              </div>
            )}

            {/* Goal */}
            <div className="space-y-3">
              <Label htmlFor="goal" className="text-[#111111]">Primary Goal</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Generate leads, showcase portfolio, sell products"
                className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
              />
            </div>

            {/* Copy Status */}
            <div className="space-y-3">
              <Label className="text-[#111111]">Do you have the copy (text content)?</Label>
              <RadioGroup value={copyStatus} onValueChange={setCopyStatus}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="final" id="final" />
                    <Label htmlFor="final" className="cursor-pointer flex-1 text-[#111111]">
                      Yes, copy is final and ready
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="review" id="review" />
                    <Label htmlFor="review" className="cursor-pointer flex-1 text-[#111111]">
                      Yes, but needs review
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Upload Copy */}
            {(copyStatus === "final" || copyStatus === "review") && (
              <div className="space-y-3">
                <Label className="text-[#111111]">Provide Copy</Label>
                <p className="text-sm text-[rgba(0,0,0,0.6)]">Upload a file or paste a link (e.g., Google Doc)</p>
                
                {/* Toggle between File and Link */}
                <div className="flex gap-2 p-1 bg-[#F9F9FB] rounded-[12px] border border-[rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    onClick={() => setCopyUploadMethod("file")}
                    className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm transition-all ${
                      copyUploadMethod === "file"
                        ? "bg-white text-[#111111] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)]"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCopyUploadMethod("link")}
                    className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm transition-all ${
                      copyUploadMethod === "link"
                        ? "bg-white text-[#111111] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)]"
                    }`}
                  >
                    Paste Link
                  </button>
                </div>

                {/* File Upload */}
                {copyUploadMethod === "file" && (
                  <div className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-[16px] p-8 text-center hover:border-[rgba(0,0,0,0.2)] transition-colors cursor-pointer bg-[#F9F9FB]">
                    <Upload className="w-8 h-8 text-[rgba(0,0,0,0.35)] mx-auto mb-3" />
                    <p className="text-[rgba(0,0,0,0.6)] mb-1">Drag and drop your copy here</p>
                    <p className="text-sm text-[rgba(0,0,0,0.35)]">or click to browse</p>
                  </div>
                )}

                {/* Link Input */}
                {copyUploadMethod === "link" && (
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
                    <Input
                      type="url"
                      placeholder="https://docs.google.com/document/..."
                      className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Need Copywriting */}
            {copyStatus === "no-copy" && (
              <div className="space-y-3">
                <Label className="text-[#111111]">Copywriting Service</Label>
                <div className="flex items-start space-x-3 p-4 rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[#F9F9FB]">
                  <input
                    type="checkbox"
                    checked={needCopywriting}
                    onChange={(e) => setNeedCopywriting(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-[#111111]">I need copywriting services</p>
                    <p className="text-sm text-[rgba(0,0,0,0.6)] mt-1">We'll write professional copy based on your brand and goals</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* CREATE NEW PAGE FIELDS */}
        {requestType === "create-new-page" && (
          <>
            {/* Website Reference */}
            <div className="space-y-3">
              <Label htmlFor="website-link" className="text-[#111111]">Website Link</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">Link to the existing website where this page will be added</p>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
                <Input
                  id="website-link"
                  type="url"
                  value={websiteLink}
                  onChange={(e) => setWebsiteLink(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
                  required
                />
              </div>
            </div>

            {/* Page Name */}
            <div className="space-y-3">
              <Label htmlFor="page-name" className="text-[#111111]">Page Name / URL</Label>
              <Input
                id="page-name"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="e.g., About Us, Pricing, /blog/new-post"
                className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
              />
            </div>

            {/* Purpose */}
            <div className="space-y-3">
              <Label htmlFor="purpose" className="text-[#111111]">Purpose of This Page</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe what this page should accomplish"
                className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
              />
            </div>

            {/* Copy Status */}
            <div className="space-y-3">
              <Label className="text-[#111111]">Do you have the copy for this page?</Label>
              <RadioGroup value={copyStatus} onValueChange={setCopyStatus}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="final" id="final-page" />
                    <Label htmlFor="final-page" className="cursor-pointer flex-1 text-[#111111]">
                      Yes, copy is final
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="review" id="review-page" />
                    <Label htmlFor="review-page" className="cursor-pointer flex-1 text-[#111111]">
                      Yes, but needs review
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Upload Copy */}
            {(copyStatus === "final" || copyStatus === "review") && (
              <div className="space-y-3">
                <Label className="text-[#111111]">Provide Copy</Label>
                <p className="text-sm text-[rgba(0,0,0,0.6)]">Upload a file or paste a link (e.g., Google Doc)</p>
                
                {/* Toggle between File and Link */}
                <div className="flex gap-2 p-1 bg-[#F9F9FB] rounded-[12px] border border-[rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    onClick={() => setCopyUploadMethod("file")}
                    className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm transition-all ${
                      copyUploadMethod === "file"
                        ? "bg-white text-[#111111] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)]"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCopyUploadMethod("link")}
                    className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm transition-all ${
                      copyUploadMethod === "link"
                        ? "bg-white text-[#111111] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)]"
                    }`}
                  >
                    Paste Link
                  </button>
                </div>

                {/* File Upload */}
                {copyUploadMethod === "file" && (
                  <div className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-[16px] p-8 text-center hover:border-[rgba(0,0,0,0.2)] transition-colors cursor-pointer bg-[#F9F9FB]">
                    <Upload className="w-8 h-8 text-[rgba(0,0,0,0.35)] mx-auto mb-3" />
                    <p className="text-[rgba(0,0,0,0.6)] mb-1">Drag and drop your copy here</p>
                    <p className="text-sm text-[rgba(0,0,0,0.35)]">or click to browse</p>
                  </div>
                )}

                {/* Link Input */}
                {copyUploadMethod === "link" && (
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
                    <Input
                      type="url"
                      placeholder="https://docs.google.com/document/..."
                      className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* UPDATE PAGE FIELDS */}
        {requestType === "update-page" && (
          <>
            {/* Page URL */}
            <div className="space-y-3">
              <Label htmlFor="page-url" className="text-[#111111]">Page URL</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">Link to the page you want to update</p>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
                <Input
                  id="page-url"
                  type="url"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="https://example.com/page-to-update"
                  className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
                  required
                />
              </div>
            </div>

            {/* What to Update */}
            <div className="space-y-3">
              <Label htmlFor="updates" className="text-[#111111]">What needs to be updated?</Label>
              <Textarea
                id="updates"
                value={updates}
                onChange={(e) => setUpdates(e.target.value)}
                placeholder="Describe the changes you need (copy updates, design changes, new sections, etc.)"
                className="rounded-[12px] min-h-[140px] border-[rgba(0,0,0,0.06)]"
              />
            </div>

            {/* Copy Changes */}
            <div className="space-y-3">
              <Label className="text-[#111111]">Are there copy changes?</Label>
              <RadioGroup value={copyStatus} onValueChange={setCopyStatus}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="no-copy-changes" id="no-copy-changes" />
                    <Label htmlFor="no-copy-changes" className="cursor-pointer flex-1 text-[#111111]">
                      No copy changes needed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="copy-provided" id="copy-provided" />
                    <Label htmlFor="copy-provided" className="cursor-pointer flex-1 text-[#111111]">
                      Yes, I'll provide the new copy
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-[12px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors">
                    <RadioGroupItem value="copy-needed" id="copy-needed" />
                    <Label htmlFor="copy-needed" className="cursor-pointer flex-1 text-[#111111]">
                      Yes, I need help writing copy
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Upload Updated Copy */}
            {copyStatus === "copy-provided" && (
              <div className="space-y-3">
                <Label className="text-[#111111]">Provide Updated Copy</Label>
                <p className="text-sm text-[rgba(0,0,0,0.6)]">Upload a file or paste a link (e.g., Google Doc)</p>
                
                {/* Toggle between File and Link */}
                <div className="flex gap-2 p-1 bg-[#F9F9FB] rounded-[12px] border border-[rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    onClick={() => setCopyUpdateMethod("file")}
                    className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm transition-all ${
                      copyUpdateMethod === "file"
                        ? "bg-white text-[#111111] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)]"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCopyUpdateMethod("link")}
                    className={`flex-1 px-4 py-2.5 rounded-[8px] text-sm transition-all ${
                      copyUpdateMethod === "link"
                        ? "bg-white text-[#111111] shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)]"
                    }`}
                  >
                    Paste Link
                  </button>
                </div>

                {/* File Upload */}
                {copyUpdateMethod === "file" && (
                  <div className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-[16px] p-8 text-center hover:border-[rgba(0,0,0,0.2)] transition-colors cursor-pointer bg-[#F9F9FB]">
                    <Upload className="w-8 h-8 text-[rgba(0,0,0,0.35)] mx-auto mb-3" />
                    <p className="text-[rgba(0,0,0,0.6)] mb-1">Drag and drop your updated copy here</p>
                    <p className="text-sm text-[rgba(0,0,0,0.35)]">or click to browse</p>
                  </div>
                )}

                {/* Link Input */}
                {copyUpdateMethod === "link" && (
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
                    <Input
                      type="url"
                      placeholder="https://docs.google.com/document/..."
                      className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* COMMON FIELDS FOR ALL TYPES */}
        
        {/* Design References */}
        <div className="space-y-3">
          <Label className="text-[#111111]">Design References</Label>
          <p className="text-sm text-[rgba(0,0,0,0.6)]">Share links to websites or designs you like</p>
          <div className="space-y-2">
            <Input
              placeholder="Reference link 1"
              value={reference1}
              onChange={(e) => setReference1(e.target.value)}
              className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
            />
            <Input
              placeholder="Reference link 2"
              value={reference2}
              onChange={(e) => setReference2(e.target.value)}
              className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
            />
            <Input
              placeholder="Reference link 3"
              value={reference3}
              onChange={(e) => setReference3(e.target.value)}
              className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
            />
          </div>
        </div>

        {/* Upload Assets */}
        <div className="space-y-3">
          <Label className="text-[#111111]">Additional Assets</Label>
          <p className="text-sm text-[rgba(0,0,0,0.6)]">Images, logos, screenshots, or other files</p>
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any other details, requirements, or constraints we should know about?"
            className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            Submit Request
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mt-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#0071E3] mx-auto mb-2" />
            <p className="text-[#0071E3] font-bold">Request Submitted!</p>
            <p className="text-sm text-[rgba(0,0,0,0.6)]">Your request has been successfully submitted.</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 font-bold">Error Submitting Request</p>
            <p className="text-sm text-[rgba(0,0,0,0.6)]">{error}</p>
          </div>
        )}
      </form>
    </FormLayout>
  );
}