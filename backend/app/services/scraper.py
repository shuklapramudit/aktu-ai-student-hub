import requests
from bs4 import BeautifulSoup

def scrape_aktu_circulars():
    """
    Scrapes official announcements from the live AKTU university portal website.
    """
    url = "https://aktu.ac.in/whatsnew.html"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        notices = []
        
        # Target the main continuous listing elements on the official site
        circular_items = soup.find_all('div', class_='news-title') or soup.find_all('li', class_='news-item')
        
        for item in circular_items[:8]:  # Process the top 8 recent entries
            link_element = item.find('a')
            if link_element:
                title = link_element.text.strip()
                href = link_element.get('href', '')
                full_link = href if href.startswith('http') else f"https://aktu.ac.in/{href}"
                
                notices.append({
                    "raw_title": title,
                    "url": full_link
                })
        return notices
    except Exception as e:
        print(f"Scraper encounter error: {str(e)}")
        return []