class BackgroundManager {
    constructor() {
        this.currentBackground = 'default';
        this.dailyImages = {};
        this.defaultBackground = 'img/landscape background.jpg';
        this.apiBase = 'http://localhost:3001'; // Use the correct backend port
        this.init();
    }

    async init() {
        // Load daily images data when page loads
        await this.loadDailyImagesData();
        this.setupEventListeners();
    }

    async loadDailyImagesData() {
        try {
            // This will trigger the backend to fetch new images if needed
            const response = await fetch(`${this.apiBase}/api/daily-images`);
            if (response.ok) {
                this.dailyImages = await response.json();
                console.log('Daily images loaded:', this.dailyImages);
                
                // Update descriptions for each button
                this.updateDescriptions();
            } else {
                console.error('Failed to load daily images');
            }
        } catch (error) {
            console.error('Error loading daily images:', error);
        }
    }

    updateDescriptions() {
        // Update the main description based on current background
        if (this.currentBackground === 'default') {
            // Keep the existing default description
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
        // Setup button event listeners
        const spaceBtn = document.getElementById('space-btn');
        const earthBtn = document.getElementById('earth-btn');
        const artBtn = document.getElementById('art-btn');

        spaceBtn?.addEventListener('click', () => this.changeBackground('space'));
        earthBtn?.addEventListener('click', () => this.changeBackground('earth'));
        artBtn?.addEventListener('click', () => this.changeBackground('art'));

        // Handle page reload/navigation - revert to default
        window.addEventListener('beforeunload', () => {
            this.changeBackground('default');
        });
    }

    async changeBackground(type) {
        try {
            if (type === 'default') {
                // Revert to default background
                document.body.style.backgroundImage = `url('${this.defaultBackground}')`;
                this.currentBackground = 'default';
                
                // Revert description to default
                const descriptionElement = document.getElementById('image-description');
                if (descriptionElement) {
                    descriptionElement.textContent = "This stunning view captures the historic city of Siena, Italy, with the magnificent Siena Cathedral (Duomo di Siena) dominating the skyline. Built between the 12th and 14th centuries, the cathedral is a masterpiece of Italian Romanesque-Gothic architecture, famous for its striped marble façade and intricate mosaic floors. Siena itself was a powerful and wealthy city-state during the Middle Ages, often in fierce rivalry with nearby Florence. Today, its perfectly preserved medieval character, winding alleys, and the world-famous Palio horse race make it a living time capsule of Italian heritage.";
                }
                return;
            }

            // Check if we have the daily image data
            if (!this.dailyImages[type]) {
                console.error(`No daily image data for type: ${type}`);
                return;
            }

            // Change background to the daily image
            const imageUrl = `${this.apiBase}/api/daily-images/${type}`;
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            this.currentBackground = type;

            // Update description
            this.updateDescriptions();

            // Visual feedback - briefly highlight the clicked button
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.backgroundManager = new BackgroundManager();
}); 