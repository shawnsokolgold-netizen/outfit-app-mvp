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
  const [manuallySelectedColors, setManuallySelectedColors] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loadingOutfit, setLoadingOutfit] = useState(false);
  const [strictMatch, setStrictMatch] = useState(true);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState({});
  const [showMannequinPreview, setShowMannequinPreview] = useState(false);
  const [anchorCategory, setAnchorCategory] = useState(null);
  const [anchorImage, setAnchorImage] = useState(null);
  const [ebayResults, setEbayResults] = useState({});
  const [ebayLoading, setEbayLoading] = useState(false);
  const [ebayError, setEbayError] = useState(null);
  const [isUpdatingResults, setIsUpdatingResults] = useState(false);
  const resultsCacheRef = useRef({});
  const imgRef = useRef(null);
  const buildTimeoutRef = useRef(null);
  const resultsRef = useRef(null);
  const appRef = useRef(null);
  const fileInputRef = useRef(null);

  // Predefined color palette for "Start from Scratch" flow
  const COLOR_PALETTE = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Gray", hex: "#808080" },
    { name: "Blue", hex: "#0066FF" },
    { name: "Green", hex: "#00AA00" },
    { name: "Teal", hex: "#008080" },
    { name: "Purple", hex: "#800080" },
    { name: "Red", hex: "#FF0000" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Orange", hex: "#FF9900" },
  ];

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

  function buildEbayQueries(colors, excludeCategory = null) {
    const colorNames = colors.map(c => c.name).join(" ");

    const queries = {
      shoes: `mens ${colorNames} basketball shoes`,
      top: `mens ${colorNames} hoodie`,
      bottom: `mens ${colorNames} joggers`,
      hat: `${colorNames} snapback hat`,
    };

    // Exclude eBay queries for the anchor category (if one was uploaded)
    if (excludeCategory) {
      const excludeKey = Object.keys(EBAY_CATEGORY_MAP).find(
        k => EBAY_CATEGORY_MAP[k] === excludeCategory
      );
      if (excludeKey) {
        delete queries[excludeKey];
      }
    }

    return queries;
  }

  function scoreEbayItem(item, colors, expectedCategory) {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const colorNames = colors.map(c => c.name.toLowerCase());

    // Bad keywords that indicate junk listings (hard filter)
    const badKeywords = [
      "women",
      "womens",
      "kids",
      "youth",
      "toddler",
      "costume",
      "lot",
      "bulk",
      "replacement",
      "sticker",
      "poster",
    ];

    for (const badKeyword of badKeywords) {
      if (titleLower.includes(badKeyword)) {
        return -1000; // Strongly exclude
      }
    }

    // Color matching (both colors present = good)
    const colorsInTitle = colorNames.filter(color =>
      titleLower.includes(color)
    ).length;
    score += colorsInTitle * 50;

    // Category-specific keyword matching
    const categoryKeywords = {
      shoes: [
        "shoe",
        "shoes",
        "sneaker",
        "sneakers",
        "basketball",
        "training",
        "sport",
      ],
      top: [
        "hoodie",
        "hoodies",
        "sweatshirt",
        "sweatshirts",
        "pullover",
        "jacket",
      ],
      bottom: [
        "pants",
        "pant",
        "jogger",
        "joggers",
        "sweatpants",
        "trousers",
      ],
      hat: ["hat", "hats", "snapback", "snapbacks", "cap", "caps", "beanie"],
    };

    const keywords = categoryKeywords[expectedCategory] || [];
    const keywordsInTitle = keywords.filter(kw => titleLower.includes(kw))
      .length;
    score += keywordsInTitle * 30;

    // Condition: New is better
    if (item.condition && item.condition.toLowerCase() === "new") {
      score += 100;
    }

    // Brand reputation (common trusted brands)
    const trustedBrands = [
      "nike",
      "adidas",
      "puma",
      "reebok",
      "under armour",
      "jordan",
      "carhartt",
      "dickies",
      "champion",
      "tommy hilfiger",
      "polo",
      "gucci",
      "supreme",
      "the north face",
    ];

    for (const brand of trustedBrands) {
      if (titleLower.includes(brand)) {
        score += 75;
        break; // Only count one brand
      }
    }

    return score;
  }

  async function fetchEbayProducts(queries) {
    setEbayLoading(true);
    setEbayError(null);
    setIsUpdatingResults(true);

    // Check cache first
    const cacheKey = getCacheKey(selectedCombo.map(c => c.name));
    if (resultsCacheRef.current[`ebay-${cacheKey}`]) {
      setEbayResults(resultsCacheRef.current[`ebay-${cacheKey}`]);
      setEbayLoading(false);
      setIsUpdatingResults(false);
      return;
    }

    try {
      const results = {};

      for (const [category, query] of Object.entries(queries)) {
        try {
          const res = await fetch("/api/ebay-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, limit: 15 }),
          });

          if (res.ok) {
            const data = await res.json();
            let items = data.items || [];

            // Score and filter items
            const selectedComboColors = selectedCombo || [];
            items = items
              .map(item => ({
                ...item,
                score: scoreEbayItem(item, selectedComboColors, category),
              }))
              .filter(item => item.score >= 0) // Remove junk listings
              .sort((a, b) => b.score - a.score) // Sort by score descending
              .slice(0, 8); // Keep top 8

            results[category] = items;
          }
        } catch (err) {
          console.error(`Failed to fetch ${category} from eBay:`, err);
        }
      }

      setEbayResults(results);

      // Cache the results
      const cacheKey = getCacheKey(selectedCombo.map(c => c.name));
      resultsCacheRef.current[`ebay-${cacheKey}`] = results;
    } catch (err) {
      console.error("eBay fetch error:", err);
      setEbayError(err.message);
    } finally {
      setEbayLoading(false);
      setIsUpdatingResults(false);
    }
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

  const EBAY_CATEGORY_MAP = {
    shoes: "Shoes",
    top: "Top",
    bottom: "Bottom",
    hat: "Hat",
  };

  function normalizeSupabaseItem(product, category, normalizedColors) {
    if (!product) return null;
    return {
      id: String(product.id),
      source: "BuildMyOutfit",
      category,
      title: product.title,
      image: product.image_url,
      price: product.price_text || "",
      affiliateUrl: product.affiliate_url,
      brand: product.brand || "",
      condition: null,
      matchExplanation: generateMatchExplanation(product, normalizedColors),
    };
  }

  function buildEpnLink(url, customId = "") {
    if (!url) return "#";

    try {
      const urlObj = new URL(url);

      // EPN parameters
      const epnParams = {
        mkcid: "1",
        mkrid: "711-53200-19255-0",
        campid: "5339147283",
        toolid: "10001",
        mkevt: "1",
      };

      // Add or update EPN parameters
      Object.entries(epnParams).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });

      // Add customid if provided
      if (customId) {
        urlObj.searchParams.set("customid", customId);
      }

      return urlObj.toString();
    } catch (err) {
      console.warn("Invalid eBay URL:", url, err);
      return url || "#";
    }
  }

  function normalizeEbayItem(item, ebayKey) {
    const itemId = item.itemId || item.legacyItemId || "item";
    const customId = `ebay_${ebayKey}_${itemId}`;
    const rawUrl = item.itemWebUrl || item.webUrl || item.itemAffiliateWebUrl || "#";
    const trackedUrl = buildEpnLink(rawUrl, customId);

    return {
      id: `ebay-${itemId}`,
      source: "eBay",
      category: EBAY_CATEGORY_MAP[ebayKey],
      title: item.title,
      image: item.image,
      price: item.price,
      affiliateUrl: trackedUrl,
      brand: null,
      condition: item.condition || null,
      matchExplanation: null,
    };
  }

  // Helper: Generate cache key from colors
  function getCacheKey(colors) {
    return colors.sort().join("-").toLowerCase();
  }

  async function requestOutfit(normalizedColors, meta, shouldScroll = false) {
    setLoadingOutfit(true);
    setIsUpdatingResults(true);

    // Check cache first
    const cacheKey = getCacheKey(normalizedColors);
    if (resultsCacheRef.current[cacheKey]) {
      setOutfits(resultsCacheRef.current[cacheKey]);
      setLoadingOutfit(false);
      setIsUpdatingResults(false);
      return;
    }

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

      const outfitData = [
        {
          ...meta,
          items: [
            result.top ? normalizeSupabaseItem(result.top, "Top", normalizedColors) : null,
            result.bottom ? normalizeSupabaseItem(result.bottom, "Bottom", normalizedColors) : null,
            result.shoe ? normalizeSupabaseItem(result.shoe, "Shoes", normalizedColors) : null,
            result.hat ? normalizeSupabaseItem(result.hat, "Hat", normalizedColors) : null,
            ...(result.hats || [])
              .filter((hat) => hat && hat.id !== result.hat?.id)
              .map((hat) => normalizeSupabaseItem(hat, "Hat", normalizedColors)),
          ].filter(Boolean),
        },
      ];

      setOutfits(outfitData);

      // Cache the results
      const cacheKey = getCacheKey(normalizedColors);
      resultsCacheRef.current[cacheKey] = outfitData;

      // Scroll to results only if explicitly requested
      if (shouldScroll) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } finally {
      setLoadingOutfit(false);
      setIsUpdatingResults(false);
    }
  }

  function toggleManualColor(color) {
    setManuallySelectedColors(prev => {
      const isSelected = prev.some(c => c.hex === color.hex);
      if (isSelected) {
        // Remove color
        return prev.filter(c => c.hex !== color.hex);
      } else {
        // Add color (max 3)
        if (prev.length < 3) {
          return [...prev, color];
        }
        return prev;
      }
    });
  }

  function buildOutfitFromManualColors() {
    if (manuallySelectedColors.length === 0) return;

    setSelectedCombo(manuallySelectedColors);
    setSelectedColor(null);
    setSelectedOutfitItems({});
    setShowMannequinPreview(false);
    setAnchorCategory(null);
    setAnchorImage(null);

    const normalizedColors = [...new Set(manuallySelectedColors.map((c) => normalizeColorName(c.name)))];
    const main = manuallySelectedColors[0];
    const names = [...new Set(manuallySelectedColors.map((c) => c.name))];

    requestOutfit(normalizedColors, {
      type: "combo",
      basedOn: names.join(" + "),
      basedOnHex: main.hex,
      source: "Manual Selection",
      comboColors: manuallySelectedColors,
    }, true);

    // Also fetch eBay products based on selected colors (exclude anchor category if set)
    const queries = buildEbayQueries(manuallySelectedColors, null);
    fetchEbayProducts(queries);
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

    // Also fetch eBay products based on selected colors (exclude anchor category if set)
    const queries = buildEbayQueries(selectedCombo, anchorCategory);
    fetchEbayProducts(queries);
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

  // Auto-build outfit when manually selected colors change (Start from Scratch)
  useEffect(() => {
    // Clear any pending timeout
    if (buildTimeoutRef.current) {
      clearTimeout(buildTimeoutRef.current);
    }

    // Only auto-build if there are manually selected colors
    if (manuallySelectedColors.length > 0) {
      // Debounce to avoid rapid API calls when quickly selecting/deselecting colors
      buildTimeoutRef.current = setTimeout(() => {
        setSelectedCombo(manuallySelectedColors);
        setSelectedColor(null);
        setSelectedOutfitItems({});
        setShowMannequinPreview(false);
        setAnchorCategory(null);
        setAnchorImage(null);

        const normalizedColors = [...new Set(manuallySelectedColors.map((c) => normalizeColorName(c.name)))];
        const main = manuallySelectedColors[0];
        const names = [...new Set(manuallySelectedColors.map((c) => c.name))];

        requestOutfit(normalizedColors, {
          type: "combo",
          basedOn: names.join(" + "),
          basedOnHex: main.hex,
          source: "Manual Selection",
          comboColors: manuallySelectedColors,
        }, false);

        // Also fetch eBay products based on selected colors
        const queries = buildEbayQueries(manuallySelectedColors, null);
        fetchEbayProducts(queries);
      }, 500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (buildTimeoutRef.current) {
        clearTimeout(buildTimeoutRef.current);
      }
    };
  }, [manuallySelectedColors]);

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

  // Unified selection and combined items display
  const DISPLAY_CATEGORIES = ["Hat", "Top", "Bottom", "Shoes"];
  const GRID_COLUMNS = 4;

  const combinedItemsByCategory = DISPLAY_CATEGORIES.reduce((acc, cat) => {
    const supabaseItems = outfits.flatMap(o => o.items).filter(i => i.category === cat);
    const ebayKey = Object.keys(EBAY_CATEGORY_MAP).find(k => EBAY_CATEGORY_MAP[k] === cat);
    const rawEbay = ebayKey ? (ebayResults[ebayKey] || []) : [];
    const allItems = [...supabaseItems, ...rawEbay.map(i => {
      const { score, ...itemWithoutScore } = i;
      return normalizeEbayItem(itemWithoutScore, ebayKey);
    })];
    // Trim to show only complete rows
    const completeRowCount = Math.floor(allItems.length / GRID_COLUMNS);
    acc[cat] = allItems.slice(0, completeRowCount * GRID_COLUMNS);
    return acc;
  }, {});

  const hasAnyItems = DISPLAY_CATEGORIES.some(cat => combinedItemsByCategory[cat].length > 0);

  function handleSelectOutfitItem(item, checked) {
    const key = item.category.toLowerCase();
    setSelectedOutfitItems(prev => ({
      ...prev,
      [key]: checked ? { category: item.category, image: item.image, title: item.title } : undefined,
    }));
  }

  // Skeleton placeholder for first load
  const SkeletonCard = () => (
    <div style={{
      backgroundColor: "#f3f4f6",
      borderRadius: "12px",
      overflow: "hidden",
      height: "280px",
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    }} />
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

      {/* Manual Color Selection - "Start from Scratch" Flow */}
      {!imageUrl && (
        <section
          style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "32px 24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            marginBottom: "24px",
            maxWidth: "1200px",
            margin: "0 auto 24px",
          }}
        >
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 8px 0"
            }}>
              Or Start from Scratch
            </h3>
            <p style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "0 0 20px 0"
            }}>
              Tap 1–3 colors to instantly build an outfit
            </p>

            {/* Color Palette Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(50px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}>
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => toggleManualColor(color)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "12px",
                    border: manuallySelectedColors.some(c => c.hex === color.hex)
                      ? "3px solid #4f46e5"
                      : "2px solid #e5e7eb",
                    backgroundColor: color.hex,
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s",
                    boxShadow: manuallySelectedColors.some(c => c.hex === color.hex)
                      ? "0 0 0 4px rgba(79, 70, 229, 0.2)"
                      : "0 2px 4px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = manuallySelectedColors.some(c => c.hex === color.hex)
                      ? "0 0 0 4px rgba(79, 70, 229, 0.2), 0 8px 16px rgba(0, 0, 0, 0.15)"
                      : "0 8px 16px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = manuallySelectedColors.some(c => c.hex === color.hex)
                      ? "0 0 0 4px rgba(79, 70, 229, 0.2)"
                      : "0 2px 4px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  {manuallySelectedColors.some(c => c.hex === color.hex) && (
                    <span style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: color.hex === "#FFFFFF" ? "#000" : "#fff",
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Color Names Display */}
            {manuallySelectedColors.length > 0 && (
              <div style={{
                backgroundColor: "#f9fafb",
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span>Selected: <strong>{manuallySelectedColors.map(c => c.name).join(" + ")}</strong></span>
                <button
                  onClick={() => setManuallySelectedColors([])}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#6b7280",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    padding: "4px 8px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#6b7280";
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Build Button */}
            <button
              onClick={() => {
                buildOutfitFromManualColors();
                // Auto-scroll to results after a brief delay for data to load
                setTimeout(() => {
                  resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              disabled={manuallySelectedColors.length === 0}
              style={{
                width: "100%",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: manuallySelectedColors.length > 0 ? "#4f46e5" : "#d1d5db",
                color: "#fff",
                fontWeight: "700",
                fontSize: "15px",
                cursor: manuallySelectedColors.length > 0 ? "pointer" : "not-allowed",
                opacity: manuallySelectedColors.length > 0 ? 1 : 0.6,
                transition: "background-color 0.2s, opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (manuallySelectedColors.length > 0) {
                  e.target.style.backgroundColor = "#4338ca";
                }
              }}
              onMouseLeave={(e) => {
                if (manuallySelectedColors.length > 0) {
                  e.target.style.backgroundColor = "#4f46e5";
                }
              }}
            >
              Build Outfit from Colors
            </button>
          </div>
        </section>
      )}

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
        {hasAnyItems && (
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

            {/* Outfit metadata header (from Supabase results) */}
            {outfits.map((outfit, i) => (
              <div key={i} style={{ marginBottom: "18px" }}>
                <div style={{ fontWeight: "700", fontSize: "18px", color: "#1f2937" }}>Based on: {outfit.basedOn}</div>
                <div style={{ color: "#4b5563", fontWeight: "500" }}>Source: {outfit.source}</div>
              </div>
            ))}

            {/* Loading states */}
            {loadingOutfit && <div style={{ padding: "8px 0", color: "#4f46e5", fontWeight: "600", fontSize: "14px", marginBottom: "10px" }}>Building your outfit...</div>}
            {ebayLoading && <div style={{ padding: "8px 0", color: "#6b7280", fontSize: "14px" }}>Loading eBay products...</div>}
            {isUpdatingResults && (outfits.length > 0 || ebayResults.shoes || ebayResults.top || ebayResults.bottom || ebayResults.hat) && (
              <div style={{ padding: "8px 0", color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>Updating results...</div>
            )}

            {/* No matches fallback (only when Supabase returned empty) */}
            {outfits.length > 0 && outfits[0].items.length === 0 && (
              <div style={{ padding: "32px 24px", textAlign: "center", backgroundColor: "#f9fafb", borderRadius: "12px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#374151" }}>No exact matches found</h3>
                <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "14px" }}>Try removing a color or turning off Match all selected colors</p>
                {strictMatch && <button onClick={() => setStrictMatch(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#4f46e5", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>Show closest matches</button>}
              </div>
            )}

            {/* Skeleton placeholders (first load) */}
            {(loadingOutfit || ebayLoading) && outfits.length === 0 && !ebayResults.shoes && !ebayResults.top && !ebayResults.bottom && !ebayResults.hat && (
              <>
                {["Hats", "Tops", "Bottoms", "Shoes"].map(category => (
                  <div key={category} style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>{category}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                      {[1, 2, 3, 4].map(i => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Unified category groups */}
            {DISPLAY_CATEGORIES.map(category => {
              const items = combinedItemsByCategory[category];
              if (!items.length) return null;
              const categoryLabel = { Hat: "Hats", Top: "Tops", Bottom: "Bottoms", Shoes: "Shoes" }[category];
              return (
                <div key={category} style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>{categoryLabel}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                    {items.map(item => {
                      const key = item.category.toLowerCase();
                      const isSelected = !!selectedOutfitItems[key] && selectedOutfitItems[key].title === item.title;
                      return (
                        <OutfitItemCard
                          key={item.id}
                          item={item}
                          isSelected={isSelected}
                          onChange={(checked) => handleSelectOutfitItem(item, checked)}
                          onPreview={() => {
                            handleSelectOutfitItem(item, true);
                            setShowMannequinPreview(true);
                            setTimeout(() => {
                              document.getElementById("preview-section")?.scrollIntoView({ behavior: "smooth" });
                            }, 0);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Preview button */}
            {hasAnyItems && (
              <div id="preview-section" style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
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

            {/* Why this outfit works (only when Supabase items present) */}
            {outfits.some(o => o.items.length > 0) && (
              <div style={{ marginTop: "24px", padding: "20px", backgroundColor: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#166534" }}>Why this outfit works</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#15803d", lineHeight: "1.6" }}>
                  The selected colors are balanced across the outfit. The top reflects your primary colors, while neutral pieces keep the look clean and wearable.
                </p>
              </div>
            )}

            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "16px" }}>
              As an Amazon Associate, I earn from qualifying purchases. eBay prices and availability subject to change.
            </p>
          </section>
        )}
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
