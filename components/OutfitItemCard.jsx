export function OutfitItemCard({ item, isSelected, onChange, onPreview }) {
  let buttonText;
  if (item.source === "eBay") {
    buttonText = "View on eBay";
  } else if (item.source === "Amazon") {
    buttonText = "View on Amazon";
  } else {
    buttonText = "View Product";
  }

  return (
    <div className={`border rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow ${
      isSelected ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-200"
    }`}>
      <img
        src={item.image}
        alt={item.title}
        className="w-full h-48 object-contain"
      />

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
          {item.title}
        </h3>

        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
          <div className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {item.category}
          </div>
          {item.source && (
            <span className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded-full ${
              item.source === "eBay" ? "bg-yellow-100 text-yellow-800" : "bg-indigo-100 text-indigo-700"
            }`}>
              {item.source}
            </span>
          )}
        </div>

        {item.matchExplanation && (
          <p className="text-xs font-semibold text-emerald-600 mb-1">
            {item.matchExplanation}
          </p>
        )}

        {item.brand && (
          <p className="text-xs text-gray-500 mb-1">
            {item.brand}
          </p>
        )}

        {item.condition && (
          <p className="text-xs text-gray-400 mb-1">
            {item.condition}
          </p>
        )}

        {item.price && (
          <p className="text-base font-bold text-gray-900 mb-2">
            {item.price}
          </p>
        )}

        <button
          onClick={() => onChange(!isSelected)}
          className={`w-full mb-2 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
            isSelected
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "border border-indigo-400 text-indigo-600 bg-white hover:bg-indigo-50"
          }`}
        >
          {isSelected ? "✓ In Preview" : "Use in Preview"}
        </button>

        <button
          onClick={() => {
            onChange(true);
            onPreview?.();
          }}
          className="w-full mb-1.5 px-2 py-0.5 rounded text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
        >
          Preview Outfit
        </button>

        {item.affiliateUrl ? (
          <a
            href={item.affiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="block text-center bg-amber-400 text-black px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-amber-500 transition-colors"
          >
            {buttonText}
          </a>
        ) : (
          <span className="block text-center bg-gray-300 text-gray-600 px-3 py-1.5 rounded-lg font-semibold text-xs">
            Link coming soon
          </span>
        )}
      </div>
    </div>
  );
}
