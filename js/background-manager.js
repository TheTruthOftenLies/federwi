console.log('[Federwi] background-manager.js loaded');

class BackgroundManager {
    constructor() {
        this.currentBackground = 'default';
        this.dailyImages = {};
        this.defaultBackground = 'img/landscape background.jpg';
        this.apiBase = 'http://localhost:3001'; // Use the correct backend port
        this.supportedTypes = ['space', 'art'];
        this.init();
    }

    async init() {
        console.log('[Federwi] BackgroundManager initializing...');
        await this.loadDailyImagesData();
        this.setupEventListeners();
    }

    async loadDailyImagesData() {
        console.log('[Federwi] loadDailyImagesData starting...');
        
        // Try to load from localStorage first
        const today = new Date().toISOString().slice(0, 10);
        const cached = localStorage.getItem('federwi_daily_images');
        let useCache = false;
        
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.date === today) {
                    this.dailyImages = parsed.data;
                    useCache = true;
                    console.log('[Federwi] Using cached images for today');
                }
            } catch (e) { 
                console.log('[Federwi] Cache parse error, will fetch fresh');
            }
        }
        
        if (!useCache) {
            console.log('[Federwi] Fetching fresh images from APIs');
            this.dailyImages = {};
            
            // Fetch NASA APOD
            try {
                const nasaResponse = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
                if (nasaResponse.ok) {
                    const nasaData = await nasaResponse.json();
                    if (nasaData.media_type === 'image') {
                        this.dailyImages.space = {
                            url: nasaData.url,
                            description: nasaData.explanation || nasaData.title || 'NASA Astronomy Picture of the Day'
                        };
                        console.log('[Federwi] NASA image loaded:', this.dailyImages.space);
                    }
                }
            } catch (error) {
                console.error('[Federwi] NASA API error:', error);
            }
            
            // Fetch Art Institute of Chicago artwork
            try {
                const articResponse = await fetch('https://api.artic.edu/api/v1/artworks?limit=1&page=1&fields=id,title,image_id,artist_display,date_display,thumbnail,artist_title');
                if (articResponse.ok) {
                    const articData = await articResponse.json();
                    if (articData.data && articData.data[0] && articData.data[0].image_id) {
                        const artwork = articData.data[0];
                        const imageUrl = `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`;
                        this.dailyImages.art = {
                            url: imageUrl,
                            description: `${artwork.title || 'Untitled'} by ${artwork.artist_title || 'Unknown Artist'}${artwork.date_display ? ` (${artwork.date_display})` : ''}. ${artwork.artist_display || ''}`
                        };
                        console.log('[Federwi] ArtIC image loaded:', this.dailyImages.art);
                    }
                }
            } catch (error) {
                console.error('[Federwi] ArtIC API error:', error);
            }
            
            // Save to localStorage with today's date
            if (Object.keys(this.dailyImages).length > 0) {
                localStorage.setItem('federwi_daily_images', JSON.stringify({ 
                    date: today, 
                    data: this.dailyImages 
                }));
                console.log('[Federwi] Images cached for today');
            }
        }
        
        console.log('[Federwi] loadDailyImagesData completed, images:', this.dailyImages);
        this.updateDescriptions();
    }

    updateDescriptions() {
        if (this.currentBackground === 'default') {
            return;
        }
        const imageData = this.dailyImages[this.currentBackground];
        if (imageData) {
            const descriptionElement = document.getElementById('image-description');
            if (descriptionElement) {
                descriptionElement.textContent = imageData.description;
            }
        }
    }

    setupEventListeners() {
        console.log('[Federwi] setupEventListeners called');
        const spaceBtn = document.getElementById('space-btn');
        const artBtn = document.getElementById('art-btn');
        console.log('[Federwi] spaceBtn:', spaceBtn);
        console.log('[Federwi] artBtn:', artBtn);
        spaceBtn?.addEventListener('click', () => this.changeBackground('space'));
        artBtn?.addEventListener('click', () => this.changeBackground('art'));
        window.addEventListener('beforeunload', () => {
            this.changeBackground('default');
        });
    }

    async changeBackground(type) {
        console.log(`[Federwi] changeBackground called with type: ${type}`);
        try {
            if (type === 'default') {
                document.body.style.backgroundImage = `url('${this.defaultBackground}')`;
                this.currentBackground = 'default';
                const descriptionElement = document.getElementById('image-description');
                if (descriptionElement) {
                    descriptionElement.textContent = "This stunning view captures the historic city of Siena, Italy, with the magnificent Siena Cathedral (Duomo di Siena) dominating the skyline. Built between the 12th and 14th centuries, the cathedral is a masterpiece of Italian Romanesque-Gothic architecture, famous for its striped marble façade and intricate mosaic floors. Siena itself was a powerful and wealthy city-state during the Middle Ages, often in fierce rivalry with nearby Florence. Today, its perfectly preserved medieval character, winding alleys, and the world-famous Palio horse race make it a living time capsule of Italian heritage.";
                }
                return;
            }
            if (!this.supportedTypes.includes(type)) {
                console.error(`Unsupported background type: ${type}`);
                return;
            }
            if (!this.dailyImages[type]) {
                console.error(`No daily image data for type: ${type}`);
                return;
            }
            
            // Use the direct image URL from the API data
            const imageData = this.dailyImages[type];
            console.log(`[Federwi] Setting background to: ${imageData.url}`);
            document.body.style.backgroundImage = `url('${imageData.url}')`;
            this.currentBackground = type;
            this.updateDescriptions();
            
            const button = document.getElementById(`${type}-btn`);
            if (button) {
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            }
        } catch (error) {
            console.error(`Error changing background to ${type}:`, error);
        }
    }
}

// Background manager will be initialized from index.html after content is shown 