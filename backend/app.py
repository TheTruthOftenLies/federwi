from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openai
import os
import requests
import random
from dotenv import load_dotenv
from datetime import datetime
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Daily images directory
DAILY_IMAGES_DIR = 'backend/daily_images'

def create_daily_images_directory():
    """Create the daily images directory if it doesn't exist"""
    if not os.path.exists(DAILY_IMAGES_DIR):
        os.makedirs(DAILY_IMAGES_DIR)

def get_today_date():
    """Get today's date in YYYY-MM-DD format"""
    return datetime.now().strftime('%Y-%m-%d')

def download_image(url, filename):
    """Download an image from URL and save it locally"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        filepath = os.path.join(DAILY_IMAGES_DIR, filename)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return filepath
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None

def fetch_nasa_image():
    """Fetch NASA APOD image and description"""
    try:
        nasa_api_key = os.getenv('NASA_API')
        if not nasa_api_key:
            print("NASA API key not found")
            return None
        
        url = f"https://api.nasa.gov/planetary/apod?api_key={nasa_api_key}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('media_type') == 'image':
            # Use HD URL if available, otherwise regular URL
            image_url = data.get('hdurl') or data.get('url')
            if image_url:
                today = get_today_date()
                filename = f"nasa_{today}.jpg"
                filepath = download_image(image_url, filename)
                
                if filepath:
                    return {
                        'type': 'space',
                        'image_path': filepath,
                        'description': data.get('explanation', ''),
                        'title': data.get('title', ''),
                        'date': today
                    }
        
        return None
    except Exception as e:
        print(f"Error fetching NASA image: {e}")
        return None

def fetch_natgeo_image():
    """Fetch National Geographic daily photo"""
    try:
        url = "https://natgeoapi.herokuapp.com/api/dailyphoto"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Construct full URL if needed
        image_url = data.get('src')
        if image_url:
            if image_url.startswith('//'):
                image_url = 'https:' + image_url
            elif not image_url.startswith('http'):
                image_url = 'https://' + image_url
            
            today = get_today_date()
            filename = f"natgeo_{today}.jpg"
            filepath = download_image(image_url, filename)
            
            if filepath:
                return {
                    'type': 'earth',
                    'image_path': filepath,
                    'description': data.get('description', ''),
                    'title': data.get('alt', ''),
                    'credit': data.get('credit', ''),
                    'date': today
                }
        
        return None
    except Exception as e:
        print(f"Error fetching National Geographic image: {e}")
        return None

def fetch_art_image():
    """Fetch Art Institute of Chicago artwork"""
    try:
        # Get a random page number for more randomness
        import random
        random_page = random.randint(1, 100)
        
        # Get artworks with images only
        url = f"https://api.artic.edu/api/v1/artworks?limit=10&page={random_page}&fields=id,title,image_id,artist_display,date_display,thumbnail,artist_title"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('data') and len(data['data']) > 0:
            # Filter for artworks with image_id
            artworks_with_images = [artwork for artwork in data['data'] if artwork.get('image_id')]
            
            if artworks_with_images:
                # Pick a random artwork from those with images
                artwork = random.choice(artworks_with_images)
                image_id = artwork.get('image_id')
                
                if image_id:
                    # Construct image URL
                    image_url = f"https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg"
                    
                    today = get_today_date()
                    filename = f"art_{today}.jpg"
                    filepath = download_image(image_url, filename)
                    
                    if filepath:
                        return {
                            'type': 'art',
                            'image_path': filepath,
                            'description': f"Artist: {artwork.get('artist_display', 'Unknown')}, Date: {artwork.get('date_display', 'Unknown')}",
                            'title': artwork.get('title', 'Untitled'),
                            'artist': artwork.get('artist_title', 'Unknown'),
                            'date': today
                        }
        
        return None
    except Exception as e:
        print(f"Error fetching Art Institute image: {e}")
        return None

def save_daily_data(data):
    """Save daily image data to JSON file"""
    try:
        today = get_today_date()
        data_file = os.path.join(DAILY_IMAGES_DIR, f"daily_data_{today}.json")
        
        with open(data_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving daily data: {e}")
        return False

def load_daily_data():
    """Load today's daily data if it exists"""
    try:
        today = get_today_date()
        data_file = os.path.join(DAILY_IMAGES_DIR, f"daily_data_{today}.json")
        
        if os.path.exists(data_file):
            with open(data_file, 'r') as f:
                return json.load(f)
        
        return None
    except Exception as e:
        print(f"Error loading daily data: {e}")
        return None

@app.route('/api/daily-images', methods=['GET'])
def get_daily_images():
    """Get today's daily images, fetching them if not already cached"""
    try:
        create_daily_images_directory()
        
        # Check if we already have today's data
        existing_data = load_daily_data()
        if existing_data:
            return jsonify(existing_data)
        
        # Fetch new images for today
        daily_data = {}
        
        # Fetch NASA image
        nasa_data = fetch_nasa_image()
        if nasa_data:
            daily_data['space'] = nasa_data
        
        # Fetch National Geographic image
        natgeo_data = fetch_natgeo_image()
        if natgeo_data:
            daily_data['earth'] = natgeo_data
        
        # Fetch Art Institute image
        art_data = fetch_art_image()
        if art_data:
            daily_data['art'] = art_data
        
        # Save the data
        if daily_data:
            save_daily_data(daily_data)
        
        return jsonify(daily_data)
        
    except Exception as e:
        print(f"Error getting daily images: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/daily-images/<image_type>', methods=['GET'])
def serve_daily_image(image_type):
    """Serve a daily image file"""
    try:
        today = get_today_date()
        filename = f"{image_type}_{today}.jpg"
        filepath = os.path.join(DAILY_IMAGES_DIR, filename)
        
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'Image not found'}), 404
            
    except Exception as e:
        print(f"Error serving daily image: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask', methods=['POST'])
def ask():
    try:
        data = request.json
        question = data.get('question', '')
        print(f"Received question: {question}") # Log the received question
        
        if not question:
            print("No question provided.") # Log if no question
            return jsonify({'error': 'No question provided'}), 400

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an image retrieval assistant and a college level professor that explains the interesting or important facts of the image that you retrieve. you only explain images that you've retrieved."},
                {"role": "user", "content": question}
            ],
            max_tokens=150,
            temperature=0.7
        )
        print(f"OpenAI API response: {response}") # Log the API response

        if response.choices and len(response.choices) > 0:
            answer = response.choices[0].message.content.strip()
            print(f"Sending answer: {answer}") # Log the extracted answer
            return jsonify({'answer': answer})
        elif response.error:
            print(f"OpenAI API error: {response.error.message}") # Log API error
            return jsonify({'error': "Error from OpenAI: " + response.error.message}), 500
        else:
            print("Unexpected API response structure.") # Log unexpected structure
            return jsonify({'error': "Sorry, no response received from API."}), 500

    except Exception as e:
        print(f"Backend error: {e}") # Log any backend exceptions
        return jsonify({'error': str(e)}), 500

@app.route('/api/search-image', methods=['POST'])
def search_image():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        category = data.get('category', '')  # Now use the category parameter
        
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        print(f"Searching for image with prompt: {prompt}, category: {category}")
        
        image_url = None
        
        # Route to specialized APIs based on category
        if category == 'space':
            # Use JWST API for space images
            image_url = get_jwst_image()
        elif category == 'art':
            # Use Metropolitan Museum API for art images
            image_url = get_met_museum_image()
        elif category == 'earth':
            # Use Unsplash with nature-specific search terms
            image_url = get_nature_image()
        else:
            # Default fallback
            image_url = get_fallback_image()
        
        if not image_url:
            return jsonify({'error': 'Failed to retrieve image for this category'}), 500

        print(f"Retrieved image URL before saving: {image_url}")

        # --- Start Image Saving Logic ---
        try:
            # Define the directory to save images
            save_dir = 'backend/retrieved_images'
            
            # Create the directory if it doesn't exist
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
            
            # Generate a unique filename using a timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            # Attempt to get file extension from URL, default to .jpg
            filename = f"image_{timestamp}.jpg"
            if '.' in image_url:
                file_extension = image_url.split('.')[-1].split('?')[0] # Handle query parameters
                if file_extension.lower() in ['jpg', 'jpeg', 'png', 'gif']:
                    filename = f"image_{timestamp}.{file_extension}"
            
            save_path = os.path.join(save_dir, filename)
            
            # Download the image
            image_response = requests.get(image_url, stream=True)
            image_response.raise_for_status() # Raise an exception for bad status codes
            
            # Save the image to the file
            with open(save_path, 'wb') as f:
                for chunk in image_response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Image successfully saved to {save_path}")

            # Only proceed with Vision API analysis after successful image save
            try:
                # Verify the image URL is accessible
                verify_response = requests.head(image_url)
                verify_response.raise_for_status()
                
                print(f"Sending this URL to Vision API: {image_url}")
                
                vision_response = openai.ChatCompletion.create(
                    model="gpt-4-vision-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a precise image analyzer. Describe exactly what you see in the image, focusing on the main subject and key details. Do not make assumptions or add details that aren't visible. If you see a specific subject (like a cat, person, or landscape), start by identifying it clearly."
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "What do you see in this image? Provide a clear, accurate description of what is actually visible in the image."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_url,
                                        "detail": "high"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=150
                )
                
                if vision_response.choices and len(vision_response.choices) > 0:
                    description = vision_response.choices[0].message.content.strip()
                else:
                    description = "Unable to analyze the image at this moment."
                    
            except Exception as vision_error:
                print(f"Vision API error: {vision_error}")
                description = "Unable to analyze the image at this moment."

        except Exception as save_error:
            print(f"Error saving image: {save_error}")
            description = "Unable to save or analyze the image at this moment."

        print(f"Final image URL: {image_url}")
        print(f"Generated description: {description}")
        
        return jsonify({
            'url': image_url,
            'description': description
        })
        
    except Exception as e:
        print(f"Image search error: {e}")
        return jsonify({'error': str(e)}), 500

def get_jwst_image():
    """Get image from James Webb Space Telescope API"""
    try:
        # Use JWST API to get a random program/observation
        # For now, we'll use a known program ID, but in production you might want to fetch a list first
        programs = [2733, 1345, 2736, 1536, 2107]  # Some popular JWST program IDs
        program_id = random.choice(programs)
        
        jwst_url = f"https://api.jwstapi.com/program/id/{program_id}"
        
        response = requests.get(jwst_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Extract image URL from JWST API response
            if 'observation_files' in data and data['observation_files']:
                # Look for preview image files
                for file in data['observation_files']:
                    if file.get('file_type') == 'preview' and file.get('file_url'):
                        return file['file_url']
            
            # Fallback to observation program image if available
            if 'program_info' in data and data['program_info'].get('observation_preview'):
                return data['program_info']['observation_preview']
                
        # If JWST API fails, fallback to space-themed Unsplash search
        return get_unsplash_image("james webb space telescope nebula")
        
    except Exception as e:
        print(f"JWST API error: {e}")
        # Fallback to space-themed Unsplash search
        return get_unsplash_image("space telescope nebula galaxy")

def get_met_museum_image():
    """Get image from Metropolitan Museum of Art API"""
    try:
        # Search for artworks with images
        search_terms = ["landscape", "nature", "portrait", "painting", "sculpture", "impressionist"]
        search_term = random.choice(search_terms)
        
        search_url = f"https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q={search_term}"
        
        response = requests.get(search_url, timeout=10)
        if response.status_code == 200:
            search_data = response.json()
            
            if 'objectIDs' in search_data and search_data['objectIDs']:
                # Get a random object from the first 20 results to ensure good quality
                object_ids = search_data['objectIDs'][:20]
                object_id = random.choice(object_ids)
                
                # Get detailed object information
                object_url = f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
                object_response = requests.get(object_url, timeout=10)
                
                if object_response.status_code == 200:
                    object_data = object_response.json()
                    
                    # Get high quality image URL
                    if object_data.get('primaryImage'):
                        return object_data['primaryImage']
                    elif object_data.get('additionalImages') and len(object_data['additionalImages']) > 0:
                        return object_data['additionalImages'][0]
        
        # If Met Museum API fails, fallback to art-themed Unsplash search
        return get_unsplash_image("classical art museum painting")
        
    except Exception as e:
        print(f"Met Museum API error: {e}")
        # Fallback to art-themed Unsplash search
        return get_unsplash_image("artwork painting museum")

def get_nature_image():
    """Get nature image using Unsplash with nature-specific search terms"""
    try:
        nature_terms = [
            "pristine nature landscape", 
            "mountain wilderness", 
            "forest waterfall", 
            "dramatic landscape", 
            "natural scenery",
            "wildlife nature",
            "scenic landscape",
            "nature photography"
        ]
        search_term = random.choice(nature_terms)
        
        return get_unsplash_image(search_term)
        
    except Exception as e:
        print(f"Nature image search error: {e}")
        return get_fallback_image()

def get_unsplash_image(query):
    """Helper function to get image from Unsplash API"""
    try:
        unsplash_url = "https://api.unsplash.com/search/photos"
        headers = {
            "Authorization": f"Client-ID {os.getenv('UNSPLASH_ACCESS_KEY', 'demo-key')}"
        }
        params = {
            "query": query,
            "per_page": 1,
            "orientation": "landscape"
        }
        
        response = requests.get(unsplash_url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            results = response.json()
            if results['results']:
                return results['results'][0]['urls']['regular']
        
        return None
        
    except Exception as e:
        print(f"Unsplash API error: {e}")
        return None

def get_fallback_image():
    """Fallback image URLs if APIs fail"""
    fallback_images = [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",  # Earth
        "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",  # Space
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"   # Art
    ]
    return random.choice(fallback_images)

# Keep the old endpoint for backwards compatibility
@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # Call OpenAI Image API
        response = openai.Image.create(
            prompt=prompt,
            n=1,
            size="1024x1024"
        )
        if response['data'] and len(response['data']) > 0:
            image_url = response['data'][0]['url']
            return jsonify({'url': image_url})
        else:
            return jsonify({'error': 'No image returned from OpenAI'}), 500
    except Exception as e:
        print(f"Image generation error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001) 