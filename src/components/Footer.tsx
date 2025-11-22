import { Globe, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.06)] bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          {/* Website */}
          <div className="flex items-center gap-6">
            <a
              href="https://camillehaidar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[rgba(0,0,0,0.6)] hover:text-[#0071E3] transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              camillehaidar.com
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/camillehaiidar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgba(0,0,0,0.6)] hover:text-[#0071E3] transition-colors"
              aria-label="X (Twitter)"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/camillehaidar/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgba(0,0,0,0.6)] hover:text-[#0071E3] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}