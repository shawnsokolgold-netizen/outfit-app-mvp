"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { OutfitItemCard } from "@/components/OutfitItemCard";
import { MannequinPreview } from "@/components/MannequinPreview";

export default function HomePage() {
  const [imageUrl, setImageUrl] = useState(null);
  const [detectedColors, setDetectedColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedCombo, setSelectedCombo] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loadingOutfit, setLoadingOutfit] = useState(false);
  const [strictMatch, setStrictMatch] = useState(true);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState({});
  const [showMannequinPreview, setShowMannequinPreview] = useState(false);
  const [anchorCategory, setAnchorCategory] = useState(null);
  const [anchorImage, setAnchorImage] = useState(null);
  const imgRef = useRef(null);
  const buildTimeoutRef = useRef(null);
  const resultsRef = useRef(null);
  const appRef = useRef(null);
  const fileInputRef = useRef(null);

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setDetectedColors([]);
    setSelectedColor(null);
    setSelectedCombo([]);
    setOutfits([]);

    // Classify and store the uploaded image as anchor
    const category = classifyUpload(file);
    setAnchorCategory(category);
    setAnchorImage(url);

    // Inject uploaded item into selectedOutfitItems
    const categoryKey = category.toLowerCase();
    setSelectedOutfitItems({
      [categoryKey]: { image: url, title: "Your Item", category: category }
    });
  }

  function classifyUpload(file) {
    const name = file.name.toLowerCase();

    if (
      name.includes("shoe") ||
      name.includes("sneaker") ||
      name.includes("kobe") ||
      name.includes("nike") ||
      name.includes("adidas") ||
      name.includes("boot")
    ) {
      return "Shoes";
    }
    if (name.includes("hat") || name.includes("cap") || name.includes("beanie")) {
      return "Hat";
    }
    if (name.includes("pant") || name.includes("jean") || name.includes("short")) {
      return "Bottom";
    }
    return "Top";
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100,
    };
  }

  function getColorName(h, s, l) {
    if (l < 12) return "Black";
    if (l > 88 && s < 15) return "White";
    if (s < 15) return "Gray";
    if (h >= 0 && h < 15) return "Red";
    if (h >= 15 && h < 40) return "Orange";
    if (h >= 40 && h < 75) return "Yellow";
    if (h >= 75 && h < 95) return "Lime";
    if (h >= 95 && h < 160) return "Green";
    if (h >= 160 && h < 190) return "Teal";
    if (h >= 190 && h < 249) return "Blue";
    if (h >= 249 && h < 289) return "Purple";
    if (h >= 289 && h < 330) return "Magenta";
    return "Pink";
  }

  function normalizeColorName(name) {
    const map = {
      Black: "black",
      White: "white",
      Gray: "gray",
      Blue: "denim",
      Teal: "teal",
      Purple: "purple",
      Yellow: "yellow",
      Lime: "teal",
      Green: "teal",
      Red: "black",
      Orange: "denim",
      Magenta: "purple",
      Pink: "white",
    };

    return map[name] || "black";
  }

  function formatProduct(product) {
    if (!product) return null;

    return {
      id: product.id,
      title: product.title,
      image: product.image_url,
      price: product.price_text || "",
      affiliateUrl: product.affiliate_url,
      brand: product.brand || "",
    };
  }

  function generateMatchExplanation(product, requestedColors) {
    if (!product?.colors || !Array.isArray(product.colors)) return null;
    
    const matchedColors = product.colors.filter(c => 
      requestedColors.includes(c.toLowerCase())
    );
    
    if (matchedColors.length === 0) return null;
    
    // Capitalize first letter of each color
    const formatted = matchedColors.map(c => 
      c.charAt(0).toUpperCase() + c.slice(1)
    );
    
    return formatted.length === 1 
      ? `Matches: ${formatted[0]}`
      : `Matches: ${formatted.join(' + ')}`;
  }

  async function requestOutfit(normalizedColors, meta, shouldScroll = false) {
    setLoadingOutfit(true);

    try {
      const res = await fetch("/api/match-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors: normalizedColors, strictMatch }),
      });

      const result = await res.json();
      console.log("frontend result:", result);

      if (!res.ok) {
        console.error(result);
        return;
      }

      setOutfits([
        {
          ...meta,
          items: [
            result.top ? { 
              category: "Top", 
              ...formatProduct(result.top),
              matchExplanation: generateMatchExplanation(result.top, normalizedColors)
            } : null,
            result.bottom ? { 
              category: "Bottom", 
              ...formatProduct(result.bottom),
              matchExplanation: generateMatchExplanation(result.bottom, normalizedColors)
            } : null,
            result.shoe ? { 
              category: "Shoes", 
              ...formatProduct(result.shoe),
              matchExplanation: generateMatchExplanation(result.shoe, normalizedColors)
            } : null,
            result.hat ? { 
              category: "Hat", 
              ...formatProduct(result.hat),
              matchExplanation: generateMatchExplanation(result.hat, normalizedColors)
            } : null,
            ...(result.hats || [])
              .filter((hat) => hat && hat.id !== result.hat?.id)
              .map((hat) => ({ 
                category: "Hat", 
                ...formatProduct(hat),
                matchExplanation: generateMatchExplanation(hat, normalizedColors)
              })),
          ].filter(Boolean),
        },
      ]);

      // Scroll to results only if explicitly requested
      if (shouldScroll) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } finally {
      setLoadingOutfit(false);
    }
  }

  function buildOutfitFromColor(color) {
    const normalized = normalizeColorName(color.name);

    requestOutfit([normalized], {
      type: "single",
      basedOn: color.name,
      basedOnHex: color.hex,
      source: selectedColor?.hex === color.hex ? "Selected Color" : "Auto Detected",
    });
  }

  function buildComboOutfit(shouldScroll = false) {
    if (selectedCombo.length === 0) return;

    const normalizedColors = [...new Set(selectedCombo.map((c) => normalizeColorName(c.name)))];
    const main = selectedCombo[0];
    const names = [...new Set(selectedCombo.map((c) => c.name))];

    requestOutfit(normalizedColors, {
      type: "combo",
      basedOn: names.join(" + "),
      basedOnHex: main.hex,
      source: "Color Combo",
      comboColors: selectedCombo,
    }, shouldScroll);
  }

  // Auto-build outfit when selectedCombo or strictMatch changes
  useEffect(() => {
    // Clear any pending timeout
    if (buildTimeoutRef.current) {
      clearTimeout(buildTimeoutRef.current);
    }

    // Only auto-build if there are selected colors
    if (selectedCombo.length > 0) {
      // Debounce to avoid rapid API calls when quickly selecting/deselecting colors
      buildTimeoutRef.current = setTimeout(() => {
        buildComboOutfit();
      }, 500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (buildTimeoutRef.current) {
        clearTimeout(buildTimeoutRef.current);
      }
    };
  }, [selectedCombo, strictMatch]);

  function handleDetectColors() {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0);

    // Sample only the center 60% of the image
    const sampleX = width * 0.2;
    const sampleY = height * 0.2;
    const sampleWidth = width * 0.6;
    const sampleHeight = height * 0.6;

    const { data } = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
    const familyMap = {};

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const hsl = rgbToHsl(r, g, b);
      let name = getColorName(hsl.h, hsl.s, hsl.l);

      // Merge Yellow and Lime into Yellow for ranking purposes
      if (name === "Lime") {
        name = "Yellow";
      }

      if (!familyMap[name]) {
        familyMap[name] = { count: 0, rTotal: 0, gTotal: 0, bTotal: 0 };
      }

      familyMap[name].count++;
      familyMap[name].rTotal += r;
      familyMap[name].gTotal += g;
      familyMap[name].bTotal += b;
    }

    // Sort by frequency and take top 6, then filter out White unless it's a strong color
    const sorted = Object.entries(familyMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, v]) => {
        const r = Math.round(v.rTotal / v.count);
        const g = Math.round(v.gTotal / v.count);
        const b = Math.round(v.bTotal / v.count);

        return {
          name,
          rgb: `RGB(${r}, ${g}, ${b})`,
          hex: rgbToHex(r, g, b),
          count: v.count,
        };
      });

    // Remove White unless it's the strongest color (top by count)
    const maxCount = sorted.length > 0 ? sorted[0].count : 0;
    const filtered = sorted.filter(color => {
      if (color.name === "White" && color.count < maxCount * 0.8) {
        return false;
      }
      return true;
    });

    // Remove count from display (keep only name, rgb, hex)
    const result = filtered.map(({ count, ...rest }) => rest);

    setDetectedColors(result);
    setSelectedColor(null);
    setSelectedCombo([]);
    setOutfits([]);
  }

  function handleImageClick(event) {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const realX = Math.floor(clickX * scaleX);
    const realY = Math.floor(clickY * scaleY);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const sr = 6;
    const sx = Math.max(0, realX - sr);
    const sy = Math.max(0, realY - sr);
    const sw = Math.min(img.naturalWidth - sx, sr * 2 + 1);
    const sh = Math.min(img.naturalHeight - sy, sr * 2 + 1);

    const { data } = ctx.getImageData(sx, sy, sw, sh);

    let rT = 0;
    let gT = 0;
    let bT = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      rT += data[i];
      gT += data[i + 1];
      bT += data[i + 2];
      count++;
    }

    if (count === 0) return;

    const r = Math.round(rT / count);
    const g = Math.round(gT / count);
    const b = Math.round(bT / count);

    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const name = getColorName(hsl.h, hsl.s, hsl.l);

    const clickedColor = { name, rgb: `RGB(${r}, ${g}, ${b})`, hex };
    setSelectedColor(clickedColor);

    // Add clicked color to selectedCombo if not already present
    const exists = selectedCombo.some((c) => c.hex === clickedColor.hex);
    if (!exists) {
      setSelectedCombo([...selectedCombo, clickedColor]);
    }
  }

  function toggleComboColor(color) {
    const exists = selectedCombo.some((c) => c.hex === color.hex);

    if (exists) {
      // Remove from combo
      const updated = selectedCombo.filter((c) => c.hex !== color.hex);
      setSelectedCombo(updated);

      // If this was the selectedColor, set to another remaining combo color or null
      if (selectedColor?.hex === color.hex) {
        setSelectedColor(updated[0] || null);
      }
    } else {
      // Add to combo and set as selectedColor
      const updated = [...selectedCombo, color];
      setSelectedCombo(updated);
      setSelectedColor(color);
    }
  }

  function ProductCard({ item }) {
    return (
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={item.image}
          alt={item.title}
          style={{
            width: "100%",
            height: "220px",
            objectFit: "contain",
            display: "block",
          }}
        />

        <div style={{ padding: "16px" }}>
          <div
            style={{
              display: "inline-block",
              fontSize: "12px",
              fontWeight: "700",
              padding: "6px 10px",
              borderRadius: "999px",
              backgroundColor: "#f3f4f6",
              marginBottom: "10px",
              color: "#374151",
            }}
          >
            {item.category}
          </div>

          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#1f2937" }}>{item.title}</h3>

          {item.matchExplanation ? (
            <p style={{ 
              margin: "0 0 8px 0", 
              color: "#059669", 
              fontSize: "13px",
              fontWeight: "600" 
            }}>
              {item.matchExplanation}
            </p>
          ) : null}

          {item.brand ? (
            <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "14px" }}>
              {item.brand}
            </p>
          ) : null}

          {item.price ? (
            <p style={{ margin: "0 0 14px 0", fontWeight: "700", fontSize: "18px", color: "#111827" }}>
              {item.price}
            </p>
          ) : null}

          {item.affiliateUrl ? (
            <a
              href={item.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              style={{
                display: "block",
                textDecoration: "none",
                backgroundColor: "#FF9900",
                color: "#000",
                padding: "12px 16px",
                borderRadius: "8px",
                fontWeight: "700",
                textAlign: "center",
                fontSize: "14px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#FFB84D"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#FF9900"}
            >
              View Product
            </a>
          ) : (
            <span
              style={{
                display: "block",
                backgroundColor: "#d1d5db",
                color: "#6b7280",
                padding: "12px 16px",
                borderRadius: "8px",
                fontWeight: "600",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              Link coming soon
            </span>
          )}
        </div>
      </div>
    );
  }

  const howItWorksSection = (
    <section
      style={{
        backgroundColor: "#fff",
        padding: "36px 20px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{
          fontSize: "32px",
          fontWeight: "700",
          margin: "0 0 28px 0",
          color: "#111827"
        }}>
          How it works
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          textAlign: "center"
        }}>
          <div>
            <div style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#4338ca",
              marginBottom: "16px"
            }}>
              1
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: "0 0 8px 0",
              color: "#111827"
            }}>
              Upload Your Photo
            </h3>
            <p style={{
              fontSize: "15px",
              color: "#1f2937",
              fontWeight: "500",
              margin: 0,
              lineHeight: "1.6"
            }}>
              Upload any outfit or item to get started.
            </p>
          </div>
          <div>
            <div style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#4338ca",
              marginBottom: "16px"
            }}>
              2
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: "0 0 8px 0",
              color: "#111827"
            }}>
              Detect Your Colors
            </h3>
            <p style={{
              fontSize: "15px",
              color: "#1f2937",
              fontWeight: "500",
              margin: 0,
              lineHeight: "1.6"
            }}>
              We analyze your image to identify key colors and tones.
            </p>
          </div>
          <div>
            <div style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#4338ca",
              marginBottom: "16px"
            }}>
              3
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: "0 0 8px 0",
              color: "#111827"
            }}>
              Discover Matching Products
            </h3>
            <p style={{
              fontSize: "15px",
              color: "#1f2937",
              fontWeight: "500",
              margin: 0,
              lineHeight: "1.6"
            }}>
              Get curated product recommendations that match your look from real brands.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "14px 20px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <Link
            href="/"
            className="text-[22px] font-extrabold tracking-tight text-gray-900 whitespace-nowrap hover:opacity-85 transition-opacity"
          >
            BuildMyOutfit
          </Link>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </Link>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center rounded-full bg-black text-white text-sm font-semibold px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Try It Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "44px 20px 58px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "40px",
            fontWeight: "800",
            margin: "0 0 10px 0",
            lineHeight: "1.15"
          }}>
            Build Better Outfits Instantly with AI
          </h2>
          <p style={{ 
            fontSize: "18px", 
            maxWidth: "640px",
            margin: "0 auto 14px",
            opacity: 0.95,
            lineHeight: "1.55"
          }}>
            Upload a photo, detect your colors, and discover matching clothing from real brands you can shop today.
          </p>
          <p style={{
            fontSize: "14px",
            margin: "0 0 14px 0",
            opacity: 0.88,
            lineHeight: "1.5"
          }}>
            Curated product recommendations • Real brands • Free to use
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#fff",
              color: "#667eea",
              fontWeight: "700",
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }}
          >
            Upload Photo
          </button>
        </div>
      </section>

      {!imageUrl && howItWorksSection}

      {imageUrl ? (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            marginBottom: "24px",
            maxWidth: "1200px",
            margin: "-32px auto 0",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Left: image + action buttons */}
            <div style={{ flex: "0 0 200px", width: "200px" }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "600", color: "#111827" }}>
                Your Photo
              </h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280" }}>
                Click image to pick colors
              </p>
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Uploaded"
                onClick={handleImageClick}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "10px",
                  objectFit: "contain",
                  display: "block",
                  cursor: "crosshair",
                  marginBottom: "10px",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={handleDetectColors}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#4338ca"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#4f46e5"}
                >
                  Detect Colors
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    color: "#6b7280",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Upload Different Photo
                </button>
              </div>
            </div>

            {/* Right: detected colors + selected colors + actions */}
            {(detectedColors.length > 0 || selectedCombo.length > 0) && (
              <div style={{ flex: "1 1 0", minWidth: "0" }}>
                {detectedColors.length > 0 && (
                  <>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#1f2937", fontWeight: "600" }}>Detected Colors</h2>
                    <p style={{ color: "#6b7280", margin: "0 0 12px 0", fontSize: "14px" }}>
                      Click colors to add or remove them from your selection.
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {detectedColors.map((color) => {
                        const active = selectedCombo.some((c) => c.hex === color.hex);
                        return (
                          <button
                            key={color.hex}
                            onClick={() => toggleComboColor(color)}
                            style={{
                              border: active ? "3px solid #111827" : "1px solid #d1d5db",
                              borderRadius: "12px",
                              padding: "10px",
                              backgroundColor: "#fff",
                              cursor: "pointer",
                              minWidth: "100px",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                backgroundColor: color.hex,
                                margin: "0 auto 8px",
                              }}
                            />
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "#1f2937" }}>{color.name}</div>
                            <div style={{ color: "#4b5563", fontSize: "12px" }}>{color.hex}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {selectedCombo.length > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h2 style={{ margin: 0, fontSize: "18px", color: "#1f2937", fontWeight: "600" }}>Selected Colors</h2>
                      {selectedCombo.length > 1 && (
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={strictMatch}
                            onChange={(e) => setStrictMatch(e.target.checked)}
                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                          />
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                            Match all colors
                          </span>
                        </label>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                      {selectedCombo.map((color) => (
                        <div
                          key={color.hex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 10px",
                            border: "1px solid #d1d5db",
                            borderRadius: "10px",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              backgroundColor: color.hex,
                              border: "1px solid #d1d5db",
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "#1f2937" }}>{color.name}</div>
                            <div style={{ color: "#4b5563", fontSize: "11px" }}>{color.hex}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {loadingOutfit && (
                      <div style={{ padding: "8px 0", color: "#4f46e5", fontWeight: "600", fontSize: "14px", marginBottom: "10px" }}>
                        Building your outfit...
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => buildComboOutfit(true)}
                        disabled={loadingOutfit}
                        style={{
                          padding: "12px 20px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: loadingOutfit ? "#9ca3af" : "#4f46e5",
                          color: "#fff",
                          fontWeight: "700",
                          cursor: loadingOutfit ? "not-allowed" : "pointer",
                          opacity: loadingOutfit ? 0.6 : 1,
                          fontSize: "14px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => { if (!loadingOutfit) e.target.style.backgroundColor = "#4338ca"; }}
                        onMouseLeave={(e) => { if (!loadingOutfit) e.target.style.backgroundColor = "#4f46e5"; }}
                      >
                        Build Outfit
                      </button>
                      <button
                        onClick={() => { setSelectedCombo([]); setSelectedColor(null); setOutfits([]); }}
                        disabled={loadingOutfit}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "10px",
                          border: "1px solid #d1d5db",
                          backgroundColor: "#fff",
                          color: "#6b7280",
                          fontWeight: "600",
                          cursor: loadingOutfit ? "not-allowed" : "pointer",
                          opacity: loadingOutfit ? 0.6 : 1,
                          fontSize: "14px",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      )}

      {/* App Section */}
      <main
        ref={appRef}
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #f9fafb, #eef2ff)",
          padding: "64px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {outfits.length > 0 ? (
          <section
            ref={resultsRef}
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#1f2937" }}>Outfit Suggestions</h2>

            {outfits.map((outfit, index) => (
              <div key={index} style={{ marginBottom: "28px" }}>
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontWeight: "700", fontSize: "18px", color: "#1f2937" }}>
                    Based on: {outfit.basedOn}
                  </div>
                  <div style={{ color: "#4b5563", fontWeight: "500" }}>Source: {outfit.source}</div>
                </div>

                {outfit.items.length === 0 ? (
                  <div style={{ 
                    padding: "32px 24px", 
                    textAlign: "center", 
                    backgroundColor: "#f9fafb",
                    borderRadius: "12px"
                  }}>
                    <h3 style={{ 
                      margin: "0 0 8px 0", 
                      fontSize: "18px", 
                      fontWeight: "600",
                      color: "#374151"
                    }}>
                      No exact matches found
                    </h3>
                    <p style={{ 
                      margin: "0 0 16px 0", 
                      color: "#6b7280",
                      fontSize: "14px"
                    }}>
                      Try removing a color or turning off Match all selected colors
                    </p>
                    {strictMatch ? (
                      <button
                        onClick={() => setStrictMatch(false)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "#4f46e5",
                          color: "#fff",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Show closest matches
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {["Hat", "Top", "Bottom", "Shoes"].map((category) => {
                      const categoryItems = outfit.items.filter(item => item.category === category);
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category} style={{ marginBottom: "24px" }}>
                          <h3 style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            marginBottom: "12px",
                            color: "#374151"
                          }}>
                            {category === "Top" ? "Tops" : category === "Bottom" ? "Bottoms" : category === "Shoes" ? "Shoes" : "Hats"}
                          </h3>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                              gap: "18px",
                            }}
                          >
                            {categoryItems.map((item) => {
                              const itemKey = `${outfit.basedOn}-${item.category}-${item.id}`;
                              const isSelected = selectedOutfitItems[itemKey];
                              return (
                                <OutfitItemCard
                                  key={itemKey}
                                  item={item}
                                  isSelected={isSelected}
                                  onChange={(checked) => {
                                    setSelectedOutfitItems((prev) => ({
                                      ...prev,
                                      [itemKey]: checked ? item : undefined,
                                    }));
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {outfit.items.length > 0 && (
                      <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
                        <button
                          onClick={() => setShowMannequinPreview(true)}
                          style={{
                            padding: "12px 24px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "#4f46e5",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "14px",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#4338ca"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "#4f46e5"}
                        >
                          Preview Outfit
                        </button>
                      </div>
                    )}
                  </>
                )}

                {outfit.items.length > 0 ? (
                  <div style={{
                    marginTop: "24px",
                    padding: "20px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "12px",
                    border: "1px solid #bbf7d0"
                  }}>
                    <h3 style={{
                      margin: "0 0 8px 0",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#166534"
                    }}>
                      Why this outfit works
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#15803d",
                      lineHeight: "1.6"
                    }}>
                      The selected colors are balanced across the outfit. The top reflects your primary colors, while neutral pieces keep the look clean and wearable.
                    </p>
                  </div>
                ) : null}
              </div>
            ))}

            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "16px" }}>
              As an Amazon Associate, I earn from qualifying purchases.
            </p>
          </section>
        ) : null}
        </div>

        {showMannequinPreview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: "20px",
            }}
            onClick={() => setShowMannequinPreview(false)}
          >
            <div
              style={{
                position: "relative",
                maxWidth: "500px",
                width: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMannequinPreview(false)}
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: 0,
                  backgroundColor: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  width: "36px",
                  height: "36px",
                  fontSize: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
              <MannequinPreview
                selectedItems={[
                  ...(anchorImage && !Object.values(selectedOutfitItems).some(item => item?.category === anchorCategory)
                    ? [{ image: anchorImage, title: "Your Item", category: anchorCategory }]
                    : []),
                  ...Object.values(selectedOutfitItems).filter(Boolean)
                ]}
              />
            </div>
          </div>
        )}
      </main>

      <footer
        style={{
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          padding: "24px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#4b5563" }}>
            <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
            {" · "}
            <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
            {" · "}
            <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</Link>
            {" · "}
            <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
            {" · "}
            <Link href="/affiliate-disclosure" style={{ color: "inherit", textDecoration: "none" }}>Affiliate Disclosure</Link>
          </p>
          <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280" }}>
            As an affiliate, BuildMyOutfit may earn from qualifying purchases.
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
            All product prices and availability are subject to change.
          </p>
          <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
            © 2026 BuildMyOutfit.com
          </p>
        </div>
      </footer>
    </>
  );
}
