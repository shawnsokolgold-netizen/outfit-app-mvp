import requests
import os

images = {
  "public/products/bottoms/white-shorts.jpg": "https://images.unsplash.com/photo-1600717535275-0b18ede2f7fc?w=400&q=80",
}

for path, url in images.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            with open(path, "wb") as f:
                f.write(r.content)
            print(f"  OK  {path}")
        else:
            print(f"  FAIL {path} - status {r.status_code}")
    except Exception as e:
        print(f"  ERROR {path} - {e}")

print("\nDone!")
