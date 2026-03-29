
export function MannequinPreview({ selectedItems }) {
  const categories = ["Hat", "Top", "Bottom", "Shoes"];
  const itemsByCategory = {};

  categories.forEach((cat) => {
    itemsByCategory[cat] = selectedItems.find((item) => item.category === cat);
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Your Outfit Preview
      </h2>

      {/* Outfit Stack Preview */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center gap-2">
          {/* Hat */}
          {itemsByCategory.Hat && itemsByCategory.Hat.image && (
            <div className="w-[110px] h-[70px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={itemsByCategory.Hat.image}
                alt="Hat"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Top */}
          {itemsByCategory.Top && itemsByCategory.Top.image && (
            <div className="w-[150px] h-[130px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={itemsByCategory.Top.image}
                alt="Top"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Bottom */}
          {itemsByCategory.Bottom && itemsByCategory.Bottom.image && (
            <div className="w-[130px] h-[150px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={itemsByCategory.Bottom.image}
                alt="Bottom"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Shoes */}
          {itemsByCategory.Shoes && (
            <div className="w-[140px] h-[85px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {itemsByCategory.Shoes.image ? (
                <img
                  src={itemsByCategory.Shoes.image}
                  alt="Shoes"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm">Shoes selected, but no image found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Items Summary */}
      <div className="space-y-2 text-sm">
        {categories.map((category) => {
          const item = itemsByCategory[category];
          return (
            <div
              key={category}
              className={`p-3 rounded-lg ${
                item
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="font-semibold text-gray-700">{category}</div>
              {item ? (
                <div className="text-gray-600">
                  {item.title.length > 30
                    ? item.title.substring(0, 30) + "..."
                    : item.title}
                </div>
              ) : (
                <div className="text-gray-400">Not selected</div>
              )}
            </div>
          );
        })}
      </div>

      {selectedItems.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium">
            ✓ {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  );
}
