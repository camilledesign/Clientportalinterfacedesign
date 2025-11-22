import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { verifyAdminCode, seedDatabase } from "../../utils/api";

interface AdminAccessGateProps {
  onSuccess: () => void;
}

export function AdminAccessGate({ onSuccess }: AdminAccessGateProps) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (index === 3 && value) {
      const fullCode = [...newCode.slice(0, 3), value].join("");
      validateCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateCode = (inputCode: string) => {
    setLoading(true);
    verifyAdminCode(inputCode)
      .then((isValid) => {
        if (isValid) {
          onSuccess();
        } else {
          setError(true);
          setShake(true);
          setCode(["", "", "", ""]);
          setTimeout(() => setShake(false), 500);
          inputRefs.current[0]?.focus();
        }
      })
      .catch(() => {
        setError(true);
        setShake(true);
        setCode(["", "", "", ""]);
        setTimeout(() => setShake(false), 500);
        inputRefs.current[0]?.focus();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = () => {
    const fullCode = code.join("");
    if (fullCode.length === 4) {
      validateCode(fullCode);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className={`bg-white rounded-[24px] p-12 shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-w-md w-full ${shake ? 'animate-shake' : ''}`}>
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-[#0071E3] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-[28px] text-[#111111] text-center mb-2">Admin Access</h1>
        <p className="text-[rgba(0,0,0,0.5)] text-center mb-8">Enter your 4-digit access code</p>

        {/* Code Input */}
        <div className="flex gap-3 justify-center mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-16 h-16 text-center text-[24px] bg-[#F5F5F7] rounded-[12px] border-2 transition-all outline-none ${
                error
                  ? "border-red-500 text-red-500"
                  : digit
                  ? "border-[#0071E3] text-[#111111]"
                  : "border-transparent text-[#111111]"
              } focus:border-[#0071E3] focus:bg-white`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm text-center mb-6 animate-in fade-in duration-200">
            Incorrect code. Please try again.
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={code.join("").length !== 4 || loading}
          className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white py-6 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Verifying..." : "Enter"}
        </Button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}