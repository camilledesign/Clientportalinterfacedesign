import { useState } from "react";
import { FormLayout } from "./FormLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Link as LinkIcon, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { submitRequest } from "../../utils/api";

interface ProductRequestFormProps {
  onBack?: () => void;
  onCategoryChange?: (category: "brand" | "website" | "product") => void;
  initialRequestType?: string;
}

export function ProductRequestForm({ onBack, onCategoryChange, initialRequestType }: ProductRequestFormProps) {
  // Map the display text to the internal value
  const getInitialValue = () => {
    if (!initialRequestType) return "new-feature";
    
    const mapping: Record<string, string> = {
      "New feature": "new-feature",
      "Update screen": "update-screen"
    };
    
    return mapping[initialRequestType] || "new-feature";
  };
  
  const [requestType, setRequestType] = useState(getInitialValue());
  const [priority, setPriority] = useState("normal");
  const [metricGoal, setMetricGoal] = useState("");
  
  // Form field states
  const [featureName, setFeatureName] = useState("");
  const [featurePurpose, setFeaturePurpose] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [screenName, setScreenName] = useState("");
  const [currentIssue, setCurrentIssue] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [reference1, setReference1] = useState("");
  const [reference2, setReference2] = useState("");
  const [reference3, setReference3] = useState("");
  const [context, setContext] = useState("");
  
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
        if (requestType === "new-feature") {
          return `New feature: ${featureName || "Untitled"}`;
        } else {
          return `Update screen: ${screenName || "Untitled"}`;
        }
      };
      
      const requestData = {
        category: "Product",
        title: getRequestTitle(),
        brief: {
          requestType,
          category: "Product",
          priority,
          ...(requestType === "new-feature" && {
            featureName,
            featurePurpose,
            targetUsers,
            metricGoal,
          }),
          ...(requestType === "update-screen" && {
            screenName,
            currentIssue,
            figmaLink,
          }),
          references: [reference1, reference2, reference3].filter(Boolean),
          context,
        }
      };

      console.log('🔵 ProductRequestForm: Submitting request', requestData);
      await submitRequest(requestData);
      setSuccess(true);
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (err: any) {
      console.error('❌ ProductRequestForm: Submit error:', err);
      
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
      title="Product Request"
      subtitle="Design new screens or improve existing UX"
      activeCategory="product"
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
                htmlFor="new-feature"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "new-feature" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="new-feature" id="new-feature" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">New feature</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">72h - 1 week</span>
                </div>
              </label>
              <label 
                htmlFor="update-screen"
                className={`flex items-center space-x-4 p-5 rounded-[12px] border-2 cursor-pointer transition-all ${requestType === "update-screen" ? "border-[#0071E3] bg-white shadow-[0_4px_12px_rgba(0,113,227,0.12)]" : "border-transparent bg-white hover:border-[rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"}`}
              >
                <RadioGroupItem value="update-screen" id="update-screen" className="w-5 h-5 border-[#E5E5E7] bg-[#F5F5F7]" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[#111111]">Update screen</span>
                  <span className="inline-block text-xs text-[#0071E3] bg-[#E8F2FD] px-2.5 py-0.5 rounded-full">24 - 48h</span>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Platform - Common for both */}
        <div className="space-y-3">
          <Label className="text-[#111111]">Platform</Label>
          <div className="flex gap-3">
            <label className="flex-1">
              <input
                type="checkbox"
                className="peer sr-only"
              />
              <div className="p-4 rounded-[12px] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors cursor-pointer peer-checked:border-[#0071E3] peer-checked:bg-[#F0F7FF] text-center text-[#111111]">
                Web
              </div>
            </label>
            <label className="flex-1">
              <input
                type="checkbox"
                className="peer sr-only"
              />
              <div className="p-4 rounded-[12px] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors cursor-pointer peer-checked:border-[#0071E3] peer-checked:bg-[#F0F7FF] text-center text-[#111111]">
                Mobile
              </div>
            </label>
          </div>
        </div>

        {/* NEW FEATURE SPECIFIC FIELDS */}
        {requestType === "new-feature" && (
          <>
            {/* Feature Name */}
            <div className="space-y-3">
              <Label htmlFor="feature-name" className="text-[#111111]">Feature Name</Label>
              <Input
                id="feature-name"
                placeholder="e.g., Advanced Search, User Dashboard, Social Sharing"
                className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
              />
            </div>

            {/* Problem to Solve */}
            <div className="space-y-3">
              <Label htmlFor="problem" className="text-[#111111]">Problem to Solve</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">What user problem or business goal does this feature address?</p>
              <Textarea
                id="problem"
                placeholder="Describe the user pain point or opportunity this feature addresses"
                className="rounded-[12px] min-h-[120px] border-[rgba(0,0,0,0.06)]"
                value={featurePurpose}
                onChange={(e) => setFeaturePurpose(e.target.value)}
              />
            </div>

            {/* User Flow */}
            <div className="space-y-3">
              <Label htmlFor="user-flow" className="text-[#111111]">User Flow</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">Describe how users will interact with this feature</p>
              <Textarea
                id="user-flow"
                placeholder="e.g., User clicks search → Filters appear → Results update in real-time"
                className="rounded-[12px] min-h-[120px] border-[rgba(0,0,0,0.06)]"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
              />
            </div>

            {/* Screens Needed */}
            <div className="space-y-3">
              <Label htmlFor="screens" className="text-[#111111]">Screens / Components Needed</Label>
              <Textarea
                id="screens"
                placeholder="List the screens or components needed for this feature"
                className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
              />
            </div>
          </>
        )}

        {/* UPDATE SCREEN SPECIFIC FIELDS */}
        {requestType === "update-screen" && (
          <>
            {/* Screen Name/Location */}
            <div className="space-y-3">
              <Label htmlFor="screen-name" className="text-[#111111]">Screen Name / Location</Label>
              <Input
                id="screen-name"
                placeholder="e.g., Dashboard, Settings Page, Checkout Flow"
                className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
              />
            </div>

            {/* Current Screen Link */}
            <div className="space-y-3">
              <Label htmlFor="current-link" className="text-[#111111]">Link to Current Screen</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">Figma link, live URL, or add a screenshot</p>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
                <Input
                  id="current-link"
                  type="url"
                  placeholder="https://figma.com/file/... or https://app.example.com/dashboard"
                  className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
                  value={figmaLink}
                  onChange={(e) => setFigmaLink(e.target.value)}
                />
              </div>
            </div>

            {/* What Needs Updating */}
            <div className="space-y-3">
              <Label htmlFor="updates" className="text-[#111111]">What Needs to be Updated?</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">Describe the specific changes needed</p>
              <Textarea
                id="updates"
                placeholder="e.g., Redesign navigation, add new buttons, improve layout, update colors"
                className="rounded-[12px] min-h-[140px] border-[rgba(0,0,0,0.06)]"
                value={currentIssue}
                onChange={(e) => setCurrentIssue(e.target.value)}
              />
            </div>

            {/* Why Update */}
            <div className="space-y-3">
              <Label htmlFor="why-update" className="text-[#111111]">Why This Update?</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">What problem does this solve or what improvement will it bring?</p>
              <Textarea
                id="why-update"
                placeholder="e.g., Users are confused by current layout, need to reduce clicks, improve accessibility"
                className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
              />
            </div>

            {/* Upload Current Screen */}
            <div className="space-y-3">
              <Label className="text-[#111111]">Upload Current Screen (Optional)</Label>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">Screenshots or recordings of the current state</p>
              <div className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-[16px] p-8 text-center hover:border-[rgba(0,0,0,0.2)] transition-colors cursor-pointer bg-[#F9F9FB]">
                <Upload className="w-8 h-8 text-[rgba(0,0,0,0.35)] mx-auto mb-3" />
                <p className="text-[rgba(0,0,0,0.6)] mb-1">Drag and drop files here</p>
                <p className="text-sm text-[rgba(0,0,0,0.35)]">or click to browse</p>
              </div>
            </div>
          </>
        )}

        {/* COMMON FIELDS FOR BOTH */}

        {/* Figma Link - Only for New Feature */}
        {requestType === "new-feature" && (
          <div className="space-y-3">
            <Label htmlFor="figma-link" className="text-[#111111]">Figma Link (if available)</Label>
            <p className="text-sm text-[rgba(0,0,0,0.6)]">Link to any existing wireframes or design explorations</p>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(0,0,0,0.35)]" />
              <Input
                id="figma-link"
                type="url"
                placeholder="https://figma.com/file/..."
                className="pl-10 rounded-[12px] border-[rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
        )}

        {/* Metric Goal */}
        <div className="space-y-3">
          <Label htmlFor="metric" className="text-[#111111]">Success Metric</Label>
          <p className="text-sm text-[rgba(0,0,0,0.6)]">
            {requestType === "new-feature" 
              ? "How will we measure if this feature is successful?" 
              : "What metric should improve with this update?"}
          </p>
          <Select value={metricGoal} onValueChange={setMetricGoal}>
            <SelectTrigger className="rounded-[12px] border-[rgba(0,0,0,0.06)]">
              <SelectValue placeholder="Select the primary metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversion">Conversion Rate</SelectItem>
              <SelectItem value="onboarding">Onboarding Completion</SelectItem>
              <SelectItem value="engagement">User Engagement</SelectItem>
              <SelectItem value="retention">User Retention</SelectItem>
              <SelectItem value="satisfaction">User Satisfaction</SelectItem>
              <SelectItem value="efficiency">Task Efficiency</SelectItem>
              <SelectItem value="adoption">Feature Adoption</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {metricGoal === "other" && (
            <Input
              placeholder="Please specify your metric goal"
              className="rounded-[12px] border-[rgba(0,0,0,0.06)]"
            />
          )}
        </div>

        {/* Priority */}
        <div className="space-y-3">
          <Label className="text-[#111111]">Priority</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPriority("low")}
              className={`px-6 py-2.5 rounded-full transition-all ${
                priority === "low"
                  ? "bg-[#111111] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                  : "bg-[#F5F5F7] text-[rgba(0,0,0,0.6)] hover:bg-white"
              }`}
            >
              Low
            </button>
            <button
              type="button"
              onClick={() => setPriority("normal")}
              className={`px-6 py-2.5 rounded-full transition-all ${
                priority === "normal"
                  ? "bg-[#111111] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                  : "bg-[#F5F5F7] text-[rgba(0,0,0,0.6)] hover:bg-white"
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setPriority("high")}
              className={`px-6 py-2.5 rounded-full transition-all ${
                priority === "high"
                  ? "bg-[#111111] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                  : "bg-[#F5F5F7] text-[rgba(0,0,0,0.6)] hover:bg-white"
              }`}
            >
              High
            </button>
          </div>
        </div>

        {/* Inspiration Upload - Only for New Feature */}
        {requestType === "new-feature" && (
          <div className="space-y-3">
            <Label className="text-[#111111]">Inspiration & References</Label>
            <p className="text-sm text-[rgba(0,0,0,0.6)]">Upload screenshots, mockups, or examples that inspire this feature</p>
            <div className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-[16px] p-8 text-center hover:border-[rgba(0,0,0,0.2)] transition-colors cursor-pointer bg-[#F9F9FB]">
              <Upload className="w-8 h-8 text-[rgba(0,0,0,0.35)] mx-auto mb-3" />
              <p className="text-[rgba(0,0,0,0.6)] mb-1">Drag and drop files here</p>
              <p className="text-sm text-[rgba(0,0,0,0.35)]">or click to browse</p>
            </div>
          </div>
        )}

        {/* Additional Context */}
        <div className="space-y-3">
          <Label htmlFor="context" className="text-[#111111]">Additional Notes</Label>
          <Textarea
            id="context"
            placeholder="Any other details, constraints, or requirements we should know?"
            className="rounded-[12px] min-h-[100px] border-[rgba(0,0,0,0.06)]"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          {submitting ? (
            <Button
              type="button"
              size="lg"
              className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
              disabled
            >
              Submitting...
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
            >
              Submit Request
            </Button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="pt-4">
            <div className="flex items-center space-x-3 text-[#0071E3]">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm">Request submitted successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="pt-4">
            <div className="flex items-center space-x-3 text-[#FF0000]">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </form>
    </FormLayout>
  );
}