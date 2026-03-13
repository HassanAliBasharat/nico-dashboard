import requests
from bs4 import BeautifulSoup
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database.db import SessionLocal
from backend.database.models import DryfruitPrice

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

PRODUCTS = {
    "almond":    "https://www.tridge.com/intelligences/almond/price",
    "pistachio": "https://www.tridge.com/intelligences/pistachio/price",
    "cashew":    "https://www.tridge.com/intelligences/cashew-nut/price",
    "walnut":    "https://www.tridge.com/intelligences/walnut/price",
    "raisin":    "https://www.tridge.com/intelligences/raisin/price",
}

def scrape_product(product, url):
    try:
        print(f"  Scraping {product}...")
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')

        # Try to find price elements
        price_tags = soup.select('[class*="price"]')
        country_tags = soup.select('[class*="country"], [class*="origin"]')

        db = SessionLocal()
        saved = 0

        if price_tags:
            for i, tag in enumerate(price_tags[:10]):
                raw = tag.get_text(strip=True)
                raw = raw.replace('$', '').replace(',', '').replace(' ', '').strip()
                try:
                    price_val = float(raw)
                    if price_val <= 0 or price_val > 100000:
                        continue
                    country = country_tags[i].get_text(strip=True) if i < len(country_tags) else 'Unknown'
                    entry = DryfruitPrice(
                        product=product,
                        price=price_val,
                        currency='USD',
                        country=country,
                        source=url,
                        date_collected=datetime.utcnow()
                    )
                    db.add(entry)
                    saved += 1
                except ValueError:
                    continue
        else:
            # If scraping fails insert a sample price so dashboard works
            sample_prices = {
                "almond": 8.50,
                "pistachio": 12.00,
                "cashew": 9.75,
                "walnut": 7.25,
                "raisin": 3.50
            }
            entry = DryfruitPrice(
                product=product,
                price=sample_prices.get(product, 5.00),
                currency='USD',
                country='Sample Data',
                source=url,
                date_collected=datetime.utcnow()
            )
            db.add(entry)
            saved = 1
            print(f"  No live data found for {product}, inserted sample price.")

        db.commit()
        db.close()
        print(f"  Saved {saved} records for {product}")

    except Exception as e:
        print(f"  ERROR scraping {product}: {e}")

def run():
    print("Starting scraper...")
    for product, url in PRODUCTS.items():
        scrape_product(product, url)
    print("Scraping complete!")

if __name__ == '__main__':
    run()