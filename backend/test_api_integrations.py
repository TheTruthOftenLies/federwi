import os
import requests
from dotenv import load_dotenv

def test_nasa_api():
    print('Testing NASA API...')
    load_dotenv()
    nasa_api_key = os.getenv('NASA_API')
    if not nasa_api_key:
        print('❌ NASA API key not found in .env')
        return False
    try:
        url = f'https://api.nasa.gov/planetary/apod?api_key={nasa_api_key}'
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        print('NASA API response:', data)
        if data.get('media_type') == 'image':
            print('✅ NASA API returned an image')
            return True
        else:
            print('⚠️ NASA API did not return an image')
            return False
    except Exception as e:
        print('❌ NASA API error:', e)
        return False

def test_natgeo_api():
    print('Testing National Geographic API...')
    try:
        url = 'https://natgeoapi.herokuapp.com/api/dailyphoto'
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        print('NatGeo API response:', data)
        if data.get('src'):
            print('✅ NatGeo API returned an image')
            return True
        else:
            print('⚠️ NatGeo API did not return an image')
            return False
    except Exception as e:
        print('❌ NatGeo API error:', e)
        return False

def test_artic_api():
    print('Testing Art Institute of Chicago API...')
    try:
        url = 'https://api.artic.edu/api/v1/artworks?limit=1&page=1&fields=id,title,image_id,artist_display,date_display,thumbnail,artist_title'
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        print('ArtIC API response:', data)
        if data.get('data') and data['data'][0].get('image_id'):
            print('✅ ArtIC API returned an image')
            return True
        else:
            print('⚠️ ArtIC API did not return an image')
            return False
    except Exception as e:
        print('❌ ArtIC API error:', e)
        return False

def main():
    print('--- API Integration Test ---')
    nasa = test_nasa_api()
    natgeo = test_natgeo_api()
    artic = test_artic_api()
    print('\nSummary:')
    print(f'NASA:   {"OK" if nasa else "FAIL"}')
    print(f'NatGeo: {"OK" if natgeo else "FAIL"}')
    print(f'ArtIC:  {"OK" if artic else "FAIL"}')

if __name__ == '__main__':
    main() 