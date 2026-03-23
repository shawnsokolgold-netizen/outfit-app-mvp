import requests
import os

images = {
  "public/products/tops/black-tee.jpg":           "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
  "public/products/tops/white-tee.jpg":           "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80",
  "public/products/tops/teal-hoodie.jpg":         "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80",
  "public/products/tops/purple-hoodie.jpg":       "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80",
  "public/products/tops/yellow-tee.jpg":          "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&q=80",
  "public/products/tops/denim-jacket.jpg":        "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=400&q=80",
  "public/products/tops/gray-crewneck.jpg":       "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80",
  "public/products/bottoms/black-joggers.jpg":    "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=80",
  "public/products/bottoms/dark-denim-jeans.jpg": "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80",
  "public/products/bottoms/light-denim-jeans.jpg":"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
  "public/products/bottoms/gray-sweatpants.jpg":  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
  "public/products/bottoms/white-shorts.jpg":     "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80",
  "public/products/bottoms/teal-shorts.jpg":      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80",
  "public/products/hats/black-cap.jpg":           "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
  "public/products/hats/white-cap.jpg":           "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80",
  "public/products/hats/teal-cap.jpg":            "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=400&q=80",
  "public/products/hats/purple-hat.jpg":          "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=400&q=80",
  "public/products/hats/yellow-cap.jpg":          "https://images.unsplash.com/photo-1596609548086-85bbf8ddb6b9?w=400&q=80",
  "public/products/hats/denim-hat.jpg":           "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=400&q=80",
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
