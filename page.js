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

  function getColorName(h, s, l, r, g, b) {
    // Classify as Black only if EXTREMELY dark AND very neutral.
    // Uses both HSL saturation and RGB channel spread to confirm neutrality,
    // preventing dark saturated colors (navy, purple, dark green) from being misclassified as Black.
    if (l < 10 && s < 10) {
      // For very dark pixels, also verify neutrality in RGB space.
      // Neutral colors have minimal spread between R, G, B channels.
      // This catches edge cases where HSL saturation alone is insufficient.
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (spread < 30) return "Black";
    }

    // Filter out near-white and light neutral backgrounds.
    // These are typically product photo backgrounds, not the item itself.
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

  // Estimate background color by sampling the four corners of the image.
  // Corner-based estimation is reliable for ecommerce product photos, which typically have
  // uniform or near-uniform backgrounds (studio lighting, plain backdrops, or white seamless).
  function estimateBackgroundColor(imageData, width, height) {
    const { data } = imageData;
    const cornerSize = Math.floor(Math.min(width, height) * 0.08); // 8% of image dimension
    const corners = [
      { startX: 0, startY: 0 }, // Top-left
      { startX: width - cornerSize, startY: 0 }, // Top-right
      { startX: 0, startY: height - cornerSize }, // Bottom-left
      { startX: width - cornerSize, startY: height - cornerSize }, // Bottom-right
    ];

    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    for (const corner of corners) {
      for (let y = corner.startY; y < corner.startY + cornerSize && y < height; y++) {
        for (let x = corner.startX; x < corner.startX + cornerSize && x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] === 0) continue; // Skip transparent
          totalR += data[idx];
          totalG += data[idx + 1];
          totalB += data[idx + 2];
          count++;
        }
      }
    }
    return count > 0 ? {
      r: Math.round(totalR / count),
      g: Math.round(totalG / count),
      b: Math.round(totalB / count),
    } : { r: 255, g: 255, b: 255 }; // Default to white if no valid corners
  }

  // Calculate RGB distance between two colors.
  // Used to determine if a pixel is similar enough to the background color.
  function rgbDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  }

  // Flood-fill background removal: mark all pixels connected to image edges that are
  // similar to the background color. This approach is more reliable than HSL thresholds because:
  // - It respects spatial connectivity (only marks contiguous background regions)
  // - It naturally handles soft shadows and color gradients near edges
  // - It preserves dark/saturated foreground colors that would be incorrectly filtered by L/S thresholds
  function buildBackgroundMask(imageData, width, height, bgColor, tolerance) {
    const { data } = imageData;
    const mask = new Uint8Array(width * height); // 1 = foreground, 0 = background
    mask.fill(1); // Assume foreground initially

    // BFS from edges to mark background regions
    const queue = [];
    const visited = new Set();

    // Add all edge pixels to the queue
    for (let x = 0; x < width; x++) {
      queue.push(x, 0); // Top edge
      queue.push(x, height - 1); // Bottom edge
    }
    for (let y = 0; y < height; y++) {
      queue.push(0, y); // Left edge
      queue.push(width - 1, y); // Right edge
    }

    for (let i = 0; i < queue.length; i += 2) {
      const x = queue[i], y = queue[i + 1];
      const key = y * width + x;
      if (visited.has(key)) continue;
      visited.add(key);

      const idx = key * 4;
      if (data[idx + 3] === 0) continue; // Skip transparent

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const dist = rgbDistance(r, g, b, bgColor.r, bgColor.g, bgColor.b);

      if (dist <= tolerance) {
        mask[key] = 0; // Mark as background
        // Add neighbors to queue
        if (x > 0) queue.push(x - 1, y);
        if (x < width - 1) queue.push(x + 1, y);
        if (y > 0) queue.push(x, y - 1);
        if (y < height - 1) queue.push(x, y + 1);
      }
    }

    return mask;
  }

  // Erode the foreground mask by 1 pixel to remove anti-aliased halos and edge contamination.
  // In product photos, the edges of objects often have soft halos from compression or anti-aliasing.
  // A pixel stays foreground only if it and most of its immediate neighbors are also foreground.
  // This single-pixel erosion is aggressive enough to remove edge fringing but preserves the object shape.
  function erodeForegroundMask(mask, width, height) {
    const eroded = new Uint8Array(mask);
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 0) continue; // Background stays background

      const y = Math.floor(i / width);
      const x = i % width;

      // Count foreground neighbors (8-connected)
      let foregroundNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
          if (mask[ny * width + nx] === 1) foregroundNeighbors++;
        }
      }

      // Erode: keep pixel as foreground only if it plus at least 6 of 8 neighbors are foreground.
      // This means at most 2 neighbors can be background (diagonal corners allowed to be background).
      if (foregroundNeighbors < 7) eroded[i] = 0;
    }
    return eroded;
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

    // Get full image data for background detection
    const fullImageData = ctx.getImageData(0, 0, width, height);

    // Step 1: Estimate background color from corners
    const bgColor = estimateBackgroundColor(fullImageData, width, height);

    // Step 2: Build foreground mask using flood-fill with RGB distance tolerance
    // Tolerance accounts for soft shadows and slight background color variations in product photos
    const bgMask = buildBackgroundMask(fullImageData, width, height, bgColor, 50);

    // Step 2b: Erode foreground mask to remove anti-aliased edge halos and background fringing
    // This single-pixel erosion removes contamination from edge anti-aliasing without destroying object shape.
    const fgMask = erodeForegroundMask(bgMask, width, height);

    // Step 3: Color detection only on foreground pixels
    const familyMap = {};
    let totalProductPixels = 0;
    const { data } = fullImageData;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue; // Skip transparent
      const pixelIdx = i / 4;
      if (fgMask[pixelIdx] === 0) continue; // Skip background and eroded edge pixels

      const r = data[i], g = data[i + 1], b = data[i + 2];
      const hsl = rgbToHsl(r, g, b);
      const name = getColorName(hsl.h, hsl.s, hsl.l, r, g, b);

      if (!familyMap[name]) familyMap[name] = { count: 0, rTotal: 0, gTotal: 0, bTotal: 0 };
      familyMap[name].count++;
      familyMap[name].rTotal += r;
      familyMap[name].gTotal += g;
      familyMap[name].bTotal += b;

      if (name !== "White" && name !== "Black") totalProductPixels += 1;
    }

    let sorted = Object.entries(familyMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, v]) => {
        const r = Math.round(v.rTotal / v.count);
        const g = Math.round(v.gTotal / v.count);
        const b = Math.round(v.bTotal / v.count);
        return { name, count: v.count, rgb: `RGB(${r}, ${g}, ${b})`, hex: rgbToHex(r, g, b) };
      });

    // Suppress weak neutrals with stricter thresholds for ecommerce product photos.
    // White and Black are often anti-aliasing artifacts, background contamination, or shadows.
    // They must represent meaningful portions of the product to be included in the palette.
    // These aggressive thresholds prevent spurious neutral colors from drowning out the real hue information.
    const whiteThreshold = totalProductPixels * 0.30; // White must be ≥30% of product
    const blackThreshold = totalProductPixels * 0.25; // Black must be ≥25% of product
    sorted = sorted.filter(item => {
      if (item.name === "White" && item.count < whiteThreshold) return false;
      if (item.name === "Black" && item.count < blackThreshold) return false;
      return true;
    });

    const filtered = sorted.slice(0, 5).map(({ name, rgb, hex }) => ({ name, rgb, hex }));

    setDetectedColors(filtered);
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
    const name = getColorName(hsl.h, hsl.s, hsl.l, r, g, b);
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
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#1f2937" }}>{item.title}</h3>
          <p style={{ margin: "0 0 14px 0", fontWeight: "700", fontSize: "18px", color: "#111827" }}>{item.price}</p>
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
