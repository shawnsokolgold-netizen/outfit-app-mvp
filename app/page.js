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
    return (
      "#" +
      [r, g, b]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  function getColorName(h, s, l) {
    if (l < 12) return "Black";
    if (l > 88 && s < 15) return "White";
    if (s < 15) return "Gray";

    if (h >= 0 && h < 15) return "Red";
    if (h >= 15 && h < 40) return "Orange";
    if (h >= 40 && h < 70) return "Yellow";
    if (h >= 70 && h < 95) return "Lime";
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

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0);

    const startX = Math.floor(width * 0.2);
    const startY = Math.floor(height * 0.2);
    const sampleWidth = Math.floor(width * 0.6);
    const sampleHeight = Math.floor(height * 0.6);

    const { data } = ctx.getImageData(startX, startY, sampleWidth, sampleHeight);

    const familyMap = {};

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const hsl = rgbToHsl(r, g, b);
      const familyName = getColorName(hsl.h, hsl.s, hsl.l);

      if (!familyMap[familyName]) {
        familyMap[familyName] = {
          count: 0,
          rTotal: 0,
          gTotal: 0,
          bTotal: 0,
        };
      }

      familyMap[familyName].count += 1;
      familyMap[familyName].rTotal += r;
      familyMap[familyName].gTotal += g;
      familyMap[familyName].bTotal += b;
    }

    const sortedFamilies = Object.entries(familyMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, value]) => {
        const r = Math.round(value.rTotal / value.count);
        const g = Math.round(value.gTotal / value.count);
        const b = Math.round(value.bTotal / value.count);

        return {
          name,
          rgb: `RGB(${r}, ${g}, ${b})`,
          hex: rgbToHex(r, g, b),
        };
      });

    setDetectedColors(sortedFamilies);
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

    const sampleRadius = 6;
    const startX = Math.max(0, realX - sampleRadius);
    const startY = Math.max(0, realY - sampleRadius);
    const sampleWidth = Math.min(img.naturalWidth - startX, sampleRadius * 2 + 1);
    const sampleHeight = Math.min(img.naturalHeight - startY, sampleRadius * 2 + 1);

    const { data } = ctx.getImageData(startX, startY, sampleWidth, sampleHeight);

    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;

      rTotal += data[i];
      gTotal += data[i + 1];
      bTotal += data[i + 2];
      count++;
    }

    if (count === 0) return;

    const r = Math.round(rTotal / count);
    const g = Math.round(gTotal / count);
    const b = Math.round(bTotal / count);

    const hsl = rgbToHsl(r, g, b);
    const name = getColorName(hsl.h, hsl.s, hsl.l);

    setSelectedColor({
      name,
      rgb: `RGB(${r}, ${g}, ${b})`,
      hex: rgbToHex(r, g, b),
      x: clickX,
      y: clickY,
    });

    setOutfits([]);
  }

  function toggleComboColor(color) {
    setSelectedCombo((prev) => {
      const exists = prev.find((c) => c.hex === color.hex);
      if (exists) {
        return prev.filter((c) => c.hex !== color.hex);
      }
      return [...prev, color];
    });
    setOutfits([]);
  }

  function getOutfitLogic(colorName) {
    const outfitMap = {
      Black: {
        top: {
          title: "Essential White Tee",
          price: "$28",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Slim Black Jeans",
          price: "$64",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Black Snapback",
          price: "$26",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      },
      White: {
        top: {
          title: "Cream Hoodie",
          price: "$58",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Light Wash Denim",
          price: "$68",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "White Dad Cap",
          price: "$24",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=900&q=80",
        },
      },
      Yellow: {
        top: {
          title: "Cream Hoodie",
          price: "$58",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Black Denim",
          price: "$66",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Yellow Statement Hat",
          price: "$30",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
        },
      },
      Lime: {
        top: {
          title: "Black Crewneck",
          price: "$55",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Gray Joggers",
          price: "$52",
          store: "Street Basics",
          image:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Lime Accent Cap",
          price: "$29",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=900&q=80",
        },
      },
      Green: {
        top: {
          title: "White Premium Tee",
          price: "$32",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Khaki Pants",
          price: "$62",
          store: "Street Basics",
          image:
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Green Accent Hat",
          price: "$28",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      },
      Teal: {
        top: {
          title: "Gray Hoodie",
          price: "$59",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Light Denim Jeans",
          price: "$68",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Teal Accent Cap",
          price: "$29",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=900&q=80",
        },
      },
      Blue: {
        top: {
          title: "Cream Crewneck",
          price: "$54",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Black Jeans",
          price: "$64",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Blue Accent Cap",
          price: "$28",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=900&q=80",
        },
      },
      Purple: {
        top: {
          title: "Black Hoodie",
          price: "$60",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Dark Denim",
          price: "$70",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Purple Accent Hat",
          price: "$30",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      },
      Gray: {
        top: {
          title: "Black Hoodie",
          price: "$60",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Charcoal Joggers",
          price: "$52",
          store: "Street Basics",
          image:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Gray Beanie",
          price: "$22",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=900&q=80",
        },
      },
      Red: {
        top: {
          title: "Cream Crewneck",
          price: "$54",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Black Jeans",
          price: "$64",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Red Accent Cap",
          price: "$28",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
        },
      },
      Orange: {
        top: {
          title: "White Box Tee",
          price: "$30",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Dark Denim",
          price: "$70",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Orange Accent Cap",
          price: "$28",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      },
      Magenta: {
        top: {
          title: "White Box Tee",
          price: "$30",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Gray Joggers",
          price: "$52",
          store: "Street Basics",
          image:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Magenta Accent Cap",
          price: "$29",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=900&q=80",
        },
      },
      Pink: {
        top: {
          title: "Gray Hoodie",
          price: "$59",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Light Wash Denim",
          price: "$68",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Pink Accent Hat",
          price: "$28",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      },
    };

    return (
      outfitMap[colorName] || {
        top: {
          title: "White Premium Tee",
          price: "$32",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        },
        bottom: {
          title: "Black Jeans",
          price: "$64",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        },
        hat: {
          title: "Classic Cap",
          price: "$24",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      }
    );
  }

  function buildOutfitFromColor(color) {
    const logic = getOutfitLogic(color.name);

    const newOutfit = {
      type: "single",
      basedOn: color.name,
      basedOnHex: color.hex,
      source:
        selectedColor && selectedColor.hex === color.hex
          ? "Selected Color"
          : "Auto Detected Color",
      items: [
        { category: "Top", ...logic.top },
        { category: "Bottom", ...logic.bottom },
        { category: "Hat", ...logic.hat },
      ],
    };

    setOutfits([newOutfit]);
  }

  function buildComboOutfit() {
    if (selectedCombo.length === 0) return;

    const names = [...new Set(selectedCombo.map((c) => c.name))];
    const mainColor = selectedCombo[0];

    const comboOutfit = {
      type: "combo",
      basedOn: names.join(" + "),
      basedOnHex: mainColor.hex,
      source: "Color Combo",
      comboColors: selectedCombo,
      items: [
        {
          category: "Top",
          title:
            names.length >= 2
              ? `Neutral Hoodie with ${names.join(" + ")} accents`
              : `Neutral Hoodie with ${names[0]} accents`,
          price: "$62",
          store: "StyleHub",
          image:
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80",
        },
        {
          category: "Bottom",
          title: "Black Jeans or Premium Denim",
          price: "$68",
          store: "Denim Co.",
          image:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        },
        {
          category: "Hat",
          title:
            names.length >= 2
              ? `${names.join(" + ")} Color-Block Hat`
              : `${names[0]} Accent Hat`,
          price: "$34",
          store: "Cap Lab",
          image:
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
        },
      ],
    };

    setOutfits([comboOutfit]);
  }

  function getMockAffiliateLink(itemTitle) {
    return `#shop-${encodeURIComponent(itemTitle.toLowerCase().replace(/\s+/g, "-"))}`;
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
            objectFit: "cover",
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
            }}
          >
            {item.category}
          </div>

          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{item.title}</h3>
          <p style={{ margin: "0 0 6px 0", color: "#4b5563" }}>{item.store}</p>
          <p style={{ margin: "0 0 14px 0", fontWeight: "700", fontSize: "18px" }}>{item.price}</p>

          <a
            href={getMockAffiliateLink(item.title)}
            style={{
              display: "inline-block",
              textDecoration: "none",
              backgroundColor: "#111827",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            Shop Item
          </a>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "38px", marginBottom: "8px" }}>Outfit Builder MVP</h1>
          <p style={{ fontSize: "18px", color: "#4b5563", marginTop: 0 }}>
            Upload a shoe, detect colors, choose what matters, and generate a shoppable outfit.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Upload & Detect</h2>

            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ marginTop: "8px", marginBottom: "16px", width: "100%" }}
            />

            {image ? (
              <>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    ref={imgRef}
                    src={image}
                    alt="Uploaded preview"
                    onClick={handleImageClick}
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      height: "320px",
                      objectFit: "cover",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      display: "block",
                      cursor: "crosshair",
                    }}
                  />

                  {selectedColor && (
                    <div
                      style={{
                        position: "absolute",
                        left: selectedColor.x - 6,
                        top: selectedColor.y - 6,
                        width: "12px",
                        height: "12px",
                        border: "2px solid red",
                        borderRadius: "50%",
                        pointerEvents: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>

                <p style={{ color: "#4b5563", fontSize: "14px", marginTop: "12px" }}>
                  Click directly on the shoe image to sample an exact color.
                </p>

                <button
                  onClick={handleDetectColors}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "12px 16px",
                    cursor: "pointer",
                    backgroundColor: "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "700",
                  }}
                >
                  Detect Top Color Families
                </button>
              </>
            ) : (
              <div
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "16px",
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                Upload a shoe image to begin
              </div>
            )}

            {selectedColor && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "16px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Selected Color</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: selectedColor.hex,
                      border: "1px solid #000",
                      borderRadius: "10px",
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: "700" }}>{selectedColor.name}</p>
                    <p style={{ margin: 0, color: "#4b5563" }}>{selectedColor.hex}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => buildOutfitFromColor(selectedColor)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "#111827",
                      color: "#fff",
                      fontWeight: "700",
                    }}
                  >
                    Build Outfit
                  </button>

                  <button
                    onClick={() => toggleComboColor(selectedColor)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#fff",
                      fontWeight: "700",
                    }}
                  >
                    {selectedCombo.find((c) => c.hex === selectedColor.hex)
                      ? "Remove from Combo"
                      : "Add to Combo"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {detectedColors.length > 0 && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Detected Colors</h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {detectedColors.map((color, index) => (
                    <div
                      key={index}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "14px",
                        backgroundColor: "#fff",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "70px",
                          backgroundColor: color.hex,
                          borderRadius: "12px",
                          border: "1px solid #d1d5db",
                          marginBottom: "12px",
                        }}
                      />
                      <p style={{ margin: "0 0 6px 0", fontWeight: "700" }}>
                        Color {index + 1}: {color.name}
                      </p>
                      <p style={{ margin: "0 0 12px 0", color: "#4b5563", fontSize: "14px" }}>{color.hex}</p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button
                          onClick={() => buildOutfitFromColor(color)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "#111827",
                            color: "#fff",
                            fontWeight: "700",
                          }}
                        >
                          Build Outfit
                        </button>

                        <button
                          onClick={() => toggleComboColor(color)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderRadius: "10px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#fff",
                            fontWeight: "700",
                          }}
                        >
                          {selectedCombo.find((c) => c.hex === color.hex)
                            ? "Remove from Combo"
                            : "Add to Combo"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCombo.length > 0 && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Selected Combo</h2>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {selectedCombo.map((color, index) => (
                    <div
                      key={`${color.hex}-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "999px",
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "999px",
                          backgroundColor: color.hex,
                          border: "1px solid #000",
                        }}
                      />
                      <span style={{ fontWeight: "700", fontSize: "14px" }}>{color.name}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={buildComboOutfit}
                  style={{
                    padding: "12px 18px",
                    cursor: "pointer",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#111827",
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  Build Outfit from Selected Colors
                </button>
              </div>
            )}

            {outfits.length > 0 && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 8px 0" }}>Generated Outfit</h2>
                    <p style={{ margin: 0, color: "#4b5563" }}>
                      Based on {outfits[0].basedOn} • {outfits[0].source}
                    </p>
                  </div>

                  {outfits[0].type === "single" && (
                    <div
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "14px",
                        backgroundColor: outfits[0].basedOnHex,
                        border: "1px solid #000",
                      }}
                    />
                  )}
                </div>

                {outfits[0].type === "combo" && outfits[0].comboColors && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px", marginBottom: "10px" }}>
                    {outfits[0].comboColors.map((color, index) => (
                      <div
                        key={`${color.hex}-${index}`}
                        title={color.name}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "10px",
                          backgroundColor: color.hex,
                          border: "1px solid #000",
                        }}
                      />
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "18px",
                    marginTop: "20px",
                  }}
                >
                  {outfits[0].items.map((item, index) => (
                    <ProductCard key={index} item={item} />
                  ))}
                </div>

                <div style={{ marginTop: "18px" }}>
                  <a
                    href="#shop-full-outfit"
                    style={{
                      display: "inline-block",
                      textDecoration: "none",
                      backgroundColor: "#111827",
                      color: "#fff",
                      padding: "12px 18px",
                      borderRadius: "12px",
                      fontWeight: "700",
                    }}
                  >
                    Shop Full Outfit
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}