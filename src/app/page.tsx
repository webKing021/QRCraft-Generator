"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import QRCode from "qrcode";
import {
  FiLink,
  FiDownload,
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiZap,
  FiShield,
  FiSmartphone,
  FiGlobe,
  FiGithub,
} from "react-icons/fi";
import {
  HiOutlineQrCode,
  HiOutlineCloudArrowUp,
  HiOutlinePaintBrush,
  HiOutlineSparkles,
} from "react-icons/hi2";

// ---------- types ----------
type ErrorLevel = "L" | "M" | "Q" | "H";
type DownloadFormat = "png" | "svg" | "jpeg";

// ---------- colour presets ----------
const COLOR_PRESETS = [
  { fg: "#000000", bg: "#ffffff", label: "Classic" },
  { fg: "#1e3a5f", bg: "#ffffff", label: "Navy" },
  { fg: "#2d6a4f", bg: "#ffffff", label: "Forest" },
  { fg: "#7b2d8b", bg: "#ffffff", label: "Purple" },
  { fg: "#c0392b", bg: "#ffffff", label: "Red" },
  { fg: "#e67e22", bg: "#ffffff", label: "Orange" },
  { fg: "#1a1a2e", bg: "#e8f0fe", label: "Midnight" },
  { fg: "#0f4c75", bg: "#bbe1fa", label: "Ocean" },
];

// ---------- helpers ----------
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}

function normalizeGoogleDriveUrl(url: string): string {
  try {
    const u = new URL(url);
    const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/view?usp=sharing`;
    }
    const folderMatch = u.pathname.match(/\/folders\/([^/?]+)/);
    if (folderMatch) {
      return `https://drive.google.com/drive/folders/${folderMatch[1]}?usp=sharing`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

// ---------- component ----------
export default function Home() {
  const [url, setUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("H");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(2);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("png");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [isDriveLink, setIsDriveLink] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const qrRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDriveLink(isGoogleDriveUrl(url));
  }, [url]);

  // --- generate QR ---
  const generateQR = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError("Please enter a URL");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setUrlError("Please enter a valid URL (e.g. https://...)");
      return;
    }
    setUrlError("");
    setGenerating(true);

    const finalUrl = isGoogleDriveUrl(trimmed)
      ? normalizeGoogleDriveUrl(trimmed)
      : trimmed;

    try {
      const opts = {
        errorCorrectionLevel: errorLevel,
        margin,
        width: size,
        color: { dark: fgColor, light: bgColor },
      };

      const [dataUrl, svg] = await Promise.all([
        QRCode.toDataURL(finalUrl, { ...opts, type: "image/png" as const }),
        QRCode.toString(finalUrl, { ...opts, type: "svg" as const }),
      ]);

      setQrDataUrl(dataUrl);
      setQrSvg(svg);
      setHasGenerated(true);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch {
      setUrlError("Failed to generate QR code. Please check your URL.");
    } finally {
      setGenerating(false);
    }
  }, [url, errorLevel, fgColor, bgColor, size, margin]);

  // --- download ---
  const download = useCallback(() => {
    if (!qrDataUrl && !qrSvg) return;
    setDownloadError("");

    try {
      const link = document.createElement("a");

      if (downloadFormat === "svg") {
        const blob = new Blob([qrSvg], { type: "image/svg+xml" });
        link.href = URL.createObjectURL(blob);
        link.download = "qrcode.svg";
      } else if (downloadFormat === "jpeg") {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setDownloadError("Failed to create canvas for JPEG conversion.");
          return;
        }
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.download = "qrcode.jpg";
          link.click();
        };
        img.onerror = () => {
          setDownloadError("Failed to process image for JPEG download.");
        };
        img.src = qrDataUrl!;
        return;
      } else {
        link.href = qrDataUrl!;
        link.download = "qrcode.png";
      }

      link.click();
    } catch {
      setDownloadError("Download failed. Please try again.");
    }
  }, [qrDataUrl, qrSvg, downloadFormat, size]);

  // --- copy image ---
  const copyImage = useCallback(async () => {
    if (!qrDataUrl) return;
    setCopyError("");
    try {
      const resp = await fetch(qrDataUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Copy failed — try downloading instead.");
      setTimeout(() => setCopyError(""), 4000);
    }
  }, [qrDataUrl]);

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-400/15 to-cyan-400/15 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-8 sm:pt-20 sm:pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur border border-gray-200/60 dark:border-white/10 mb-6 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
            <HiOutlineQrCode className="text-blue-600 dark:text-blue-400 text-lg" />
            QRCraft
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Permanent</span>{" "}
            QR Codes
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Generate free, permanent QR codes for any link — especially{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">Google Drive</span> share URLs.
            No sign-up. No expiration. No data stored.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { icon: <FiZap />, text: "Instant" },
              { icon: <FiShield />, text: "100% Private" },
              { icon: <FiGlobe />, text: "Works Forever" },
              { icon: <FiSmartphone />, text: "Any Scanner" },
            ].map((b) => (
              <span
                key={b.text}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full border border-gray-200/50 dark:border-white/10"
              >
                {b.icon} {b.text}
              </span>
            ))}
          </div>

          {/* Developer CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Built by{" "}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Krutarth Raychura
              </span>
            </span>
            <a
              href="https://github.com/webKing021/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-gray-900/20 dark:shadow-white/10 hover:shadow-xl hover:scale-105 active:scale-100"
            >
              <FiGithub className="text-base" />
              Follow on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* ===== HOW-IT-WORKS STEPS ===== */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          How It Works
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
          Three simple steps to get your permanent QR code
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: 1,
              icon: <HiOutlineCloudArrowUp className="text-3xl" />,
              title: "Paste Your Link",
              desc: "Copy your Google Drive share URL (or any link) and paste it below. Make sure the link is set to \u201CAnyone with the link can view\u201D.",
            },
            {
              step: 2,
              icon: <HiOutlinePaintBrush className="text-3xl" />,
              title: "Customize (Optional)",
              desc: "Choose colours, size, error correction level, and more. The default settings work great for most use-cases.",
            },
            {
              step: 3,
              icon: <HiOutlineSparkles className="text-3xl" />,
              title: "Generate & Download",
              desc: "Hit \u201CGenerate QR Code\u201D, then download as PNG, SVG, or JPEG \u2014 or copy it to your clipboard instantly.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="group relative bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200/70 dark:border-white/10 p-6 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                {s.step}
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                {s.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== GENERATOR CARD ===== */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-white dark:bg-gray-900/70 rounded-3xl border border-gray-200/70 dark:border-white/10 shadow-xl shadow-gray-200/40 dark:shadow-black/30 overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiOutlineQrCode className="text-blue-600 dark:text-blue-400" />
              QRCraft Generator
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Paste any URL and generate a scannable QR code instantly
            </p>
          </div>

          {/* URL input */}
          <div className="px-6 sm:px-8 py-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiLink className="inline mr-1.5 -mt-0.5" />
              Enter your URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && generateQR()}
                placeholder="https://drive.google.com/file/d/... or any link"
                className={`w-full rounded-xl border ${
                  urlError
                    ? "border-red-400 focus:ring-red-400/30"
                    : "border-gray-300 dark:border-gray-700 focus:ring-blue-500/30"
                } bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base`}
              />
              {isDriveLink && url.trim() && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                  Google Drive ✓
                </span>
              )}
            </div>
            {urlError && (
              <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                <FiInfo className="shrink-0" /> {urlError}
              </p>
            )}

            {isDriveLink && (
              <div className="mt-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
                <FiInfo className="shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Make sure your Google Drive file or folder is shared as{" "}
                  <em>&quot;Anyone with the link&quot;</em> so people can access it after scanning.
                </span>
              </div>
            )}
          </div>

          {/* Advanced options */}
          <div className="px-6 sm:px-8 pb-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              {showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
              Customization Options
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                {/* Colour presets */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Colour Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          setFgColor(p.fg);
                          setBgColor(p.bg);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          fgColor === p.fg && bgColor === p.bg
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: p.fg }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom colours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      QR Colour
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Size slider */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between mb-1">
                    <span>Size</span>
                    <span className="text-gray-400 font-mono">{size}px</span>
                  </label>
                  <input
                    type="range"
                    min={150}
                    max={1000}
                    step={50}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>150px</span>
                    <span>1000px</span>
                  </div>
                </div>

                {/* Margin slider */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between mb-1">
                    <span>Margin (Quiet Zone)</span>
                    <span className="text-gray-400 font-mono">{margin}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    step={1}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Error correction */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Error Correction Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["L", "M", "Q", "H"] as ErrorLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setErrorLevel(lvl)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                          errorLevel === lvl
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        {lvl}
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {lvl === "L" && "7%"}
                          {lvl === "M" && "15%"}
                          {lvl === "Q" && "25%"}
                          {lvl === "H" && "30%"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Higher = more resistant to damage, slightly denser pattern. &quot;H&quot; recommended.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="px-6 sm:px-8 py-5">
            <button
              onClick={generateQR}
              disabled={generating}
              className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 text-base sm:text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <HiOutlineQrCode className="text-xl" />
                  Generate QR Code
                </span>
              )}
            </button>
          </div>

          {/* ===== RESULT ===== */}
          {hasGenerated && qrDataUrl && (
            <div
              ref={resultRef}
              className="border-t border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-8"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-6">
                Your QR Code is Ready! 🎉
              </h3>

              <div
                ref={qrRef}
                className="mx-auto w-fit p-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: bgColor }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Generated QR code"
                  className="mx-auto"
                  style={{
                    width: Math.min(size, 300),
                    height: Math.min(size, 300),
                  }}
                />
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Format:
                  </span>
                  {(["png", "svg", "jpeg"] as DownloadFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDownloadFormat(f)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        downloadFormat === f
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <button
                    onClick={download}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md cursor-pointer"
                  >
                    <FiDownload />
                    Download {downloadFormat.toUpperCase()}
                  </button>
                  <button
                    onClick={copyImage}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <FiCheck className="text-green-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy Image
                      </>
                    )}
                  </button>
                </div>

                {/* Error messages for download/copy */}
                {downloadError && (
                  <p className="text-red-500 text-sm text-center mt-2 flex items-center justify-center gap-1">
                    <FiInfo className="shrink-0" /> {downloadError}
                  </p>
                )}
                {copyError && (
                  <p className="text-red-500 text-sm text-center mt-2 flex items-center justify-center gap-1">
                    <FiInfo className="shrink-0" /> {copyError}
                  </p>
                )}
              </div>

              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/5 dark:to-emerald-500/5 border border-green-200 dark:border-green-500/20 rounded-xl p-4 text-sm text-green-700 dark:text-green-300 text-center">
                <strong>This QR code is permanent!</strong> It directly encodes your URL — no
                redirect service, no expiry. It will work as long as the destination
                link is active.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Why are these QR codes permanent?",
              a: "Unlike many online QR services that route through their own servers (and expire), our QR codes encode your URL directly into the pattern. There\u2019s no middleman \u2014 the QR code itself contains your link, so it will work forever as long as the destination URL is active.",
            },
            {
              q: "How do I share a Google Drive file properly?",
              a: "Open Google Drive \u2192 Right-click your file/folder \u2192 Share \u2192 General access \u2192 \u201CAnyone with the link\u201D \u2192 Copy link \u2192 Paste here. This ensures anyone who scans the QR code can access it.",
            },
            {
              q: "Is my data stored anywhere?",
              a: "No. Everything happens in your browser. We don\u2019t store your URLs, QR codes, or any personal information. Your data never leaves your device.",
            },
            {
              q: "What\u2019s the best size and error correction for printing?",
              a: "For printing, use at least 300px size with \u201CH\u201D (High) error correction. This ensures the QR code scans reliably even if slightly damaged or printed at lower quality.",
            },
            {
              q: "Can I use this for any URL?",
              a: "Yes! While this tool is optimized for Google Drive links, you can generate QR codes for any valid URL \u2014 websites, YouTube videos, social media profiles, payment links, and more.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group bg-white dark:bg-gray-900/60 rounded-xl border border-gray-200/70 dark:border-white/10 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors list-none">
                {faq.q}
                <FiChevronDown className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <div className="px-5 pb-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200/60 dark:border-white/5 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <HiOutlineQrCode className="text-blue-600 dark:text-blue-400 text-xl" />
            <span className="font-bold text-lg text-gray-800 dark:text-gray-200">
              QRCraft
            </span>
          </div>
          <p className="text-center">
            Free &amp; open. No data collected. No sign-up required.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200/50 dark:border-blue-500/20">
              <span className="text-gray-500 dark:text-gray-400">Developed by</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Krutarth Raychura
              </span>
            </div>
            <a
              href="https://github.com/webKing021/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
            >
              <FiGithub className="text-base" />
              Follow on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
