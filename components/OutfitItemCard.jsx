export function OutfitItemCard({ item, isSelected, onChange }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow">
      <img
        src={item.image}
        alt={item.title}
        className="w-full h-56 object-contain"
      />

      <div className="p-4">
        <label className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 mt-1 accent-indigo-600 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">
              {item.title}
            </h3>
          </div>
        </label>

        <div className="inline-block text-xs font-bold px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 mb-2">
          {item.category}
        </div>

        {item.matchExplanation && (
          <p className="text-sm font-semibold text-emerald-600 mb-2">
            {item.matchExplanation}
          </p>
        )}

        {item.brand && (
          <p className="text-sm text-gray-500 mb-2">
            {item.brand}
          </p>
        )}

        {item.price && (
          <p className="text-lg font-bold text-gray-900 mb-3">
            {item.price}
          </p>
        )}

        {item.affiliateUrl ? (
          <a
            href={item.affiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="block text-center bg-amber-400 text-black px-4 py-3 rounded-lg font-bold text-sm hover:bg-amber-500 transition-colors"
          >
            View Product
          </a>
        ) : (
          <span className="block text-center bg-gray-300 text-gray-600 px-4 py-3 rounded-lg font-semibold text-sm">
            Link coming soon
          </span>
        )}
      </div>
    </div>
  );
}
