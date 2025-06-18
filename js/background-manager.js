console.log('[Federwi] background-manager.js loaded');

class BackgroundManager {
    constructor() {
        this.currentBackground = 'default';
        this.defaultBackground = 'img/landscape background.jpg';
        this.defaultDescription = "This stunning view captures the historic city of Siena, Italy, with the magnificent Siena Cathedral (Duomo di Siena) dominating the skyline. Built between the 12th and 14th centuries, the cathedral is a masterpiece of Italian Romanesque-Gothic architecture, famous for its striped marble façade and intricate mosaic floors. Siena itself was a powerful and wealthy city-state during the Middle Ages, often in fierce rivalry with nearby Florence. Today, its perfectly preserved medieval character, winding alleys, and the world-famous Palio horse race make it a living time capsule of Italian heritage.";
        this.init();
    }

    async init() {
        console.log('[Federwi] BackgroundManager initializing...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('[Federwi] setupEventListeners called');
        const spaceBtn = document.getElementById('space-btn');
        const artBtn = document.getElementById('art-btn');
        console.log('[Federwi] spaceBtn:', spaceBtn);
        console.log('[Federwi] artBtn:', artBtn);
        
        if (spaceBtn) {
            spaceBtn.addEventListener('click', () => {
                console.log('[Federwi] Space button clicked');
                this.changeBackground('space');
            });
        }
        
        if (artBtn) {
            artBtn.addEventListener('click', () => {
                console.log('[Federwi] Art button clicked');
                this.changeBackground('art');
            });
        }
    }

    async fetchNASAImage() {
        const today = new Date().toISOString().slice(0, 10);
        const cacheKey = `nasa_image_${today}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            console.log('[Federwi] Using cached NASA image');
            return JSON.parse(cached);
        }
        
        try {
            console.log('[Federwi] Fetching NASA APOD...');
            // Note: This will fail due to CORS unless NASA API allows it or we use a proxy
            const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
            const data = await response.json();
            
            if (data.media_type === 'image') {
                const imageData = {
                    url: data.url,
                    description: data.explanation,
                    title: data.title
                };
                localStorage.setItem(cacheKey, JSON.stringify(imageData));
                return imageData;
            }
        } catch (error) {
            console.error('[Federwi] NASA API error:', error);
        }
        
        return null;
    }

    async fetchArtICImage() {
        const today = new Date().toISOString().slice(0, 10);
        const cacheKey = `artic_image_${today}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            console.log('[Federwi] Using cached ArtIC image');
            return JSON.parse(cached);
        }
        
        try {
            console.log('[Federwi] Fetching ArtIC artwork...');
            const response = await fetch('https://api.artic.edu/api/v1/artworks?limit=1&page=1&fields=id,title,image_id,artist_display,date_display,thumbnail,artist_title');
            const data = await response.json();
            
            if (data.data && data.data[0] && data.data[0].image_id) {
                const artwork = data.data[0];
                const imageUrl = `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`;
                const imageData = {
                    url: imageUrl,
                    description: `${artwork.title} by ${artwork.artist_display || 'Unknown Artist'}. ${artwork.date_display || ''}`,
                    title: artwork.title
                };
                localStorage.setItem(cacheKey, JSON.stringify(imageData));
                return imageData;
            }
        } catch (error) {
            console.error('[Federwi] ArtIC API error:', error);
        }
        
        return null;
    }

    async changeBackground(type) {
        console.log(`[Federwi] Changing background to: ${type}`);
        
        try {
            if (type === 'default') {
                document.body.style.backgroundImage = `url('${this.defaultBackground}')`;
                this.currentBackground = 'default';
                const descriptionElement = document.getElementById('image-description');
                if (descriptionElement) {
                    descriptionElement.textContent = this.defaultDescription;
                }
                return;
            }

            let imageData = null;
            
            if (type === 'space') {
                imageData = await this.fetchNASAImage();
            } else if (type === 'art') {
                imageData = await this.fetchArtICImage();
            }
            
            if (imageData) {
                console.log(`[Federwi] Setting background to: ${imageData.url}`);
                document.body.style.backgroundImage = `url('${imageData.url}')`;
                this.currentBackground = type;
                
                const descriptionElement = document.getElementById('image-description');
                if (descriptionElement) {
                    descriptionElement.textContent = imageData.description;
                }
                
                // Visual feedback
                const button = document.getElementById(`${type}-btn`);
                if (button) {
                    button.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);
                }
            } else {
                console.error(`[Federwi] Failed to fetch ${type} image`);
            }

        } catch (error) {
            console.error(`[Federwi] Error changing background to ${type}:`, error);
        }
    }
}

// Background manager will be initialized from index.html after content is shown 
// Background manager will be initialized from index.html after content is shown 