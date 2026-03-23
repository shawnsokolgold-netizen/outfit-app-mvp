"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [image, setImage] = useState("");
  const [detectedColors, setDetectedColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedCombo, setSelectedCombo] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const imgRef = useRef(null);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);
    setDetectedColors([]);
    setSelectedColor(null);
    setSelectedCombo([]);
    setOutfits([]);
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
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
    if (h >= 190 && h < 250) return "Blue";
    if (h >= 250 && h < 290) return "Purple";
    if (h >= 290 && h < 330) return "Magenta";
    return "Pink";
  }

  function handleDetectColors() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = img.naturalWidth, height = img.naturalHeight;
    canvas.width = width; canvas.height = height;
    ctx.drawImage(img, 0, 0);
    const startX = Math.floor(width * 0.2), startY = Math.floor(height * 0.2);
    const sampleWidth = Math.floor(width * 0.6), sampleHeight = Math.floor(height * 0.6);
    const { data } = ctx.getImageData(startX, startY, sampleWidth, sampleHeight);
    const familyMap = {};
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const hsl = rgbToHsl(r, g, b);
      const name = getColorName(hsl.h, hsl.s, hsl.l);
      if (!familyMap[name]) familyMap[name] = { count: 0, rTotal: 0, gTotal: 0, bTotal: 0 };
      familyMap[name].count++;
      familyMap[name].rTotal += r;
      familyMap[name].gTotal += g;
      familyMap[name].bTotal += b;
    }
    const sorted = Object.entries(familyMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, v]) => {
        const r = Math.round(v.rTotal / v.count);
        const g = Math.round(v.gTotal / v.count);
        const b = Math.round(v.bTotal / v.count);
        return { name, rgb: `RGB(${r}, ${g}, ${b})`, hex: rgbToHex(r, g, b) };
      });
    setDetectedColors(sorted);
    setOutfits([]);
  }

  function handleImageClick(event) {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const clickX = event.clientX - rect.left, clickY = event.clientY - rect.top;
    const scaleX = img.naturalWidth / rect.width, scaleY = img.naturalHeight / rect.height;
    const realX = Math.floor(clickX * scaleX), realY = Math.floor(clickY * scaleY);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const sr = 6;
    const sx = Math.max(0, realX - sr), sy = Math.max(0, realY - sr);
    const sw = Math.min(img.naturalWidth - sx, sr * 2 + 1), sh = Math.min(img.naturalHeight - sy, sr * 2 + 1);
    const { data } = ctx.getImageData(sx, sy, sw, sh);
    let rT = 0, gT = 0, bT = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      rT += data[i]; gT += data[i + 1]; bT += data[i + 2]; count++;
    }
    if (count === 0) return;
    const r = Math.round(rT / count), g = Math.round(gT / count), b = Math.round(bT / count);
    const hsl = rgbToHsl(r, g, b);
    const name = getColorName(hsl.h, hsl.s, hsl.l);
    setSelectedColor({ name, rgb: `RGB(${r}, ${g}, ${b})`, hex: rgbToHex(r, g, b), x: clickX, y: clickY });
    setOutfits([]);
  }

  function toggleComboColor(color) {
    setSelectedCombo((prev) => {
      const exists = prev.find((c) => c.hex === color.hex);
      return exists ? prev.filter((c) => c.hex !== color.hex) : [...prev, color];
    });
    setOutfits([]);
  }

  // ── YOUR LOCAL PRODUCT IMAGES ──────────────────────────────────────────────
  const products = {
    tops: {
      black:  { title: "Black Tee",       price: "$25", image: "/products/tops/black-tee.jpg" },
      white:  { title: "White Tee",       price: "$25", image: "/products/tops/white-tee.jpg" },
      teal:   { title: "Teal Hoodie",     price: "$55", image: "/products/tops/teal-hoodie.jpg" },
      purple: { title: "Purple Hoodie",   price: "$55", image: "/products/tops/purple-hoodie.jpg" },
      yellow: { title: "Yellow Tee",      price: "$30", image: "/products/tops/yellow-tee.jpg" },
      denim:  { title: "Denim Jacket",    price: "$80", image: "/products/tops/denim-jacket.jpg" },
      gray:   { title: "Gray Crewneck",   price: "$45", image: "/products/tops/gray-crewneck.jpg" },
    },
    bottoms: {
      black:  { title: "Black Joggers",        price: "$45", image: "/products/bottoms/black-joggers.jpg" },
      denim:  { title: "Dark Denim Jeans",     price: "$65", image: "/products/bottoms/dark-denim-jeans.jpg" },
      lightDenim: { title: "Light Denim Jeans", price: "$60", image: "/products/bottoms/light-denim-jeans.jpg" },
      gray:   { title: "Gray Sweatpants",      price: "$40", image: "/products/bottoms/gray-sweatpants.jpg" },
      white:  { title: "White Shorts",         price: "$35", image: "/products/bottoms/white-shorts.jpg" },
      teal:   { title: "Teal Shorts",          price: "$38", image: "/products/bottoms/teal-shorts.jpg" },
    },
    hats: {
      black:  { title: "Black Cap",    price: "$28", image: "/products/hats/black-cap.jpg" },
      white:  { title: "White Cap",    price: "$28", image: "/products/hats/white-cap.jpg" },
      teal:   { title: "Teal Cap",     price: "$32", image: "/products/hats/teal-cap.jpg" },
      purple: { title: "Purple Hat",   price: "$28", image: "/products/hats/purple-hat.jpg" },
      yellow: { title: "Yellow Cap",   price: "$24", image: "/products/hats/yellow-cap.jpg" },
      denim:  { title: "Denim Hat",    price: "$30", image: "/products/hats/denim-hat.jpg" },
    },
  };

  function getOutfitLogic(colorName) {
    const map = {
      Black:   { top: products.tops.white,  bottom: products.bottoms.denim,      hat: products.hats.black  },
      White:   { top: products.tops.gray,   bottom: products.bottoms.lightDenim,  hat: products.hats.white  },
      Yellow:  { top: products.tops.yellow, bottom: products.bottoms.black,       hat: products.hats.yellow },
      Lime:    { top: products.tops.black,  bottom: products.bottoms.gray,        hat: products.hats.teal   },
      Green:   { top: products.tops.white,  bottom: products.bottoms.denim,       hat: products.hats.denim  },
      Teal:    { top: products.tops.teal,   bottom: products.bottoms.lightDenim,  hat: products.hats.teal   },
      Blue:    { top: products.tops.gray,   bottom: products.bottoms.black,       hat: products.hats.denim  },
      Purple:  { top: products.tops.purple, bottom: products.bottoms.denim,       hat: products.hats.purple },
      Gray:    { top: products.tops.black,  bottom: products.bottoms.gray,        hat: products.hats.black  },
      Red:     { top: products.tops.white,  bottom: products.bottoms.black,       hat: products.hats.black  },
      Orange:  { top: products.tops.white,  bottom: products.bottoms.denim,       hat: products.hats.black  },
      Magenta: { top: products.tops.white,  bottom: products.bottoms.gray,        hat: products.hats.purple },
      Pink:    { top: products.tops.gray,   bottom: products.bottoms.lightDenim,  hat: products.hats.white  },
    };
    return map[colorName] || { top: products.tops.white, bottom: products.bottoms.denim, hat: products.hats.black };
  }

  function buildOutfitFromColor(color) {
    const logic = getOutfitLogic(color.name);
    setOutfits([{
      type: "single",
      basedOn: color.name,
      basedOnHex: color.hex,
      source: selectedColor?.hex === color.hex ? "Selected Color" : "Auto Detected",
      items: [
        { category: "Top",    ...logic.top },
        { category: "Bottom", ...logic.bottom },
        { category: "Hat",    ...logic.hat },
      ],
    }]);
  }

  function buildComboOutfit() {
    if (selectedCombo.length === 0) return;
    const names = [...new Set(selectedCombo.map((c) => c.name))];
    const main = selectedCombo[0];
    const logic = getOutfitLogic(main.name);
    setOutfits([{
      type: "combo",
      basedOn: names.join(" + "),
      basedOnHex: main.hex,
      source: "Color Combo",
      comboColors: selectedCombo,
      items: [
        { category: "Top",    ...logic.top    },
        { category: "Bottom", ...logic.bottom },
        { category: "Hat",    ...logic.hat    },
      ],
    }]);
  }

  function ProductCard({ item }) {
    return (
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
        <img src={item.image} alt={item.title} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />
        <div style={{ padding: "16px" }}>
          <div style={{ display: "inline-block", fontSize: "12px", fontWeight: "700", padding: "6px 10px", borderRadius: "999px", backgroundColor: "#f3f4f6", marginBottom: "10px" }}>
            {item.category}
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{item.title}</h3>
          <p style={{ margin: "0 0 14px 0", fontWeight: "700", fontSize: "18px" }}>{item.price}</p>
          <a href="#shop" style={{ display: "inline-block", textDecoration: "none", backgroundColor: "#111827", color: "#fff", padding: "10px 14px", borderRadius: "10px", fontWeight: "600" }}>
            Shop Item
          </a>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "32px", fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "38px", marginBottom: "8px" }}>Outfit Builder MVP</h1>
          <p style={{ fontSize: "18px", color: "#4b5563", marginTop: 0 }}>Upload a shoe, detect colors, and generate a shoppable outfit.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}>
          {/* LEFT PANEL */}
          <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
            <h2 style={{ marginTop: 0 }}>Upload & Detect</h2>
            <input type="file" accept="image/*" onChange={handleUpload} style={{ marginTop: "8px", marginBottom: "16px", width: "100%" }} />

            {image ? (
              <>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img ref={imgRef} src={image} alt="Uploaded preview" onClick={handleImageClick}
                    style={{ width: "100%", maxWidth: "320px", height: "320px", objectFit: "cover", borderRadius: "16px", border: "1px solid #d1d5db", display: "block", cursor: "crosshair" }} />
                  {selectedColor && (
                    <div style={{ position: "absolute", left: selectedColor.x - 6, top: selectedColor.y - 6, width: "12px", height: "12px", border: "2px solid red", borderRadius: "50%", pointerEvents: "none", boxSizing: "border-box" }} />
                  )}
                </div>
                <p style={{ color: "#4b5563", fontSize: "14px", marginTop: "12px" }}>Click the shoe to sample an exact color.</p>
                <button onClick={handleDetectColors} style={{ width: "100%", marginTop: "8px", padding: "12px 16px", cursor: "pointer", backgroundColor: "#111827", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700" }}>
                  Detect Top Color Families
                </button>
              </>
            ) : (
              <div style={{ border: "2px dashed #d1d5db", borderRadius: "16px", padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
                Upload a shoe image to begin
              </div>
            )}

            {selectedColor && (
              <div style={{ marginTop: "20px", padding: "16px", borderRadius: "16px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <h3 style={{ marginTop: 0 }}>Selected Color</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ width: "48px", height: "48px", backgroundColor: selectedColor.hex, border: "1px solid #000", borderRadius: "10px" }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: "700" }}>{selectedColor.name}</p>
                    <p style={{ margin: 0, color: "#4b5563" }}>{selectedColor.hex}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => buildOutfitFromColor(selectedColor)} style={{ padding: "10px 14px", cursor: "pointer", borderRadius: "10px", border: "none", backgroundColor: "#111827", color: "#fff", fontWeight: "700" }}>
                    Build Outfit
                  </button>
                  <button onClick={() => toggleComboColor(selectedColor)} style={{ padding: "10px 14px", cursor: "pointer", borderRadius: "10px", border: "1px solid #d1d5db", backgroundColor: "#fff", fontWeight: "700" }}>
                    {selectedCombo.find((c) => c.hex === selectedColor.hex) ? "Remove from Combo" : "Add to Combo"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {detectedColors.length > 0 && (
              <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                <h2 style={{ marginTop: 0 }}>Detected Colors</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                  {detectedColors.map((color, index) => (
                    <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "16px", padding: "14px", backgroundColor: "#fff" }}>
                      <div style={{ width: "100%", height: "70px", backgroundColor: color.hex, borderRadius: "12px", border: "1px solid #d1d5db", marginBottom: "12px" }} />
                      <p style={{ margin: "0 0 6px 0", fontWeight: "700" }}>Color {index + 1}: {color.name}</p>
                      <p style={{ margin: "0 0 12px 0", color: "#4b5563", fontSize: "14px" }}>{color.hex}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button onClick={() => buildOutfitFromColor(color)} style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "10px", border: "none", backgroundColor: "#111827", color: "#fff", fontWeight: "700" }}>
                          Build Outfit
                        </button>
                        <button onClick={() => toggleComboColor(color)} style={{ padding: "10px 12px", cursor: "pointer", borderRadius: "10px", border: "1px solid #d1d5db", backgroundColor: "#fff", fontWeight: "700" }}>
                          {selectedCombo.find((c) => c.hex === color.hex) ? "Remove from Combo" : "Add to Combo"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCombo.length > 0 && (
              <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                <h2 style={{ marginTop: 0 }}>Selected Combo</h2>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {selectedCombo.map((color, index) => (
                    <div key={`${color.hex}-${index}`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "999px", backgroundColor: color.hex, border: "1px solid #000" }} />
                      <span style={{ fontWeight: "700", fontSize: "14px" }}>{color.name}</span>
                    </div>
                  ))}
                </div>
                <button onClick={buildComboOutfit} style={{ padding: "12px 18px", cursor: "pointer", borderRadius: "12px", border: "none", backgroundColor: "#111827", color: "#fff", fontWeight: "700" }}>
                  Build Outfit from Selected Colors
                </button>
              </div>
            )}

            {outfits.length > 0 && (
              <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 8px 0" }}>Generated Outfit</h2>
                    <p style={{ margin: 0, color: "#4b5563" }}>Based on {outfits[0].basedOn} · {outfits[0].source}</p>
                  </div>
                  {outfits[0].type === "single" && (
                    <div style={{ width: "54px", height: "54px", borderRadius: "14px", backgroundColor: outfits[0].basedOnHex, border: "1px solid #000" }} />
                  )}
                </div>
                {outfits[0].type === "combo" && outfits[0].comboColors && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px", marginBottom: "10px" }}>
                    {outfits[0].comboColors.map((color, index) => (
                      <div key={`${color.hex}-${index}`} title={color.name} style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: color.hex, border: "1px solid #000" }} />
                    ))}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginTop: "20px" }}>
                  {outfits[0].items.map((item, index) => (
                    <ProductCard key={index} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
