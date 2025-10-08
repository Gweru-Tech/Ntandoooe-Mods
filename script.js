// Global variables
let isLoggedIn = false;
let siteData = {
    title: "Ntando Mods Pro - Professional Modification Services",
    navLogo: "🔧 Ntando Mods Pro",
    heroTitle: "Professional Modification Services",
    heroDescription: "Transform your devices and applications with expert modifications",
    services: [
        {
            id: 1,
            name: "Mobile App Mods",
            icon: "📱",
            description: "Custom modifications for Android and iOS applications with enhanced features and functionality.",
            features: ["✓ UI/UX Enhancements", "✓ Feature Additions", "✓ Performance Optimization"],
            price: "Starting from $299",
            type: "contact"
        },
        {
            id: 2,
            name: "Game Modifications",
            icon: "🎮",
            description: "Professional game modding services for enhanced gaming experiences and custom content.",
            features: ["✓ Custom Maps & Levels", "✓ Character Modifications", "✓ Gameplay Enhancements"],
            price: "Starting from $199",
            type: "contact"
        },
        {
            id: 3,
            name: "Software Customization",
            icon: "💻",
            description: "Tailored software solutions and modifications to meet your specific requirements.",
            features: ["✓ Interface Customization", "✓ Plugin Development", "✓ Integration Solutions"],
            price: "Starting from $399",
            type: "contact"
        },
        {
            id: 4,
            name: "Security Audits",
            icon: "🛡️",
            description: "Comprehensive security analysis and vulnerability assessments for your applications.",
            features: ["✓ Code Review", "✓ Penetration Testing", "✓ Security Recommendations"],
            price: "Starting from $499",
            type: "contact"
        }
    ],
    audio: {
        url: "background-music.mp3",
        autoplay: false
    }
};

// Load data from localStorage
function loadSiteData() {
    const saved = localStorage.getItem('ntandoModsData');
    if (saved) {
        siteData = { ...siteData, ...JSON.parse(saved) };
    }
    updateSiteContent();
    loadServices();
}

// Save data to localStorage
function saveSiteData() {
    localStorage.setItem('ntandoModsData', JSON.stringify(siteData));
}

// Update site content
function updateSiteContent() {
    document.getElementById('site-title').textContent = siteData.title;
    document.getElementById('nav-logo').textContent = siteData.navLogo;
    document.getElementById('hero-title').textContent = siteData.heroTitle;
    document.getElementById('hero-description').textContent = siteData.heroDescription;
}

// Load services
function loadServices() {
    const servicesGrid = document.getElementById('services-grid');
    const serviceSelect = document.getElementById('serviceSelect');
    
    servicesGrid.innerHTML = '';
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    
    siteData.services.forEach(service => {
        // Add to services grid
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <div class="service-type">${service.type}</div>
            <h3>${service.icon} ${service.name}</h3>
            <p>${service.description}</p>
            <ul>
                ${service.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <p><strong>${service.price}</strong></p>
        `;
        servicesGrid.appendChild(serviceCard);
        
        // Add to select dropdown
        const option = document.createElement('option');
        option.value = service.name.toLowerCase().replace(/\s+/g, '-');
        option.textContent = service.name;
        serviceSelect.appendChild(option);
    });
}

// Audio functionality
function initAudio() {
    const audio = document.getElementById('backgroundAudio');
    const audioToggle = document.getElementById('audioToggle');
    const volumeControl = document.getElementById('volumeControl');
    
    audio.volume = 0.3;
    
    audioToggle.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(e => console.log('Audio play failed:', e));
            audioToggle.textContent = '🔊 Music';
        } else {
            audio.pause();
            audioToggle.textContent = '🔇 Music';
        }
    });
    
    volumeControl.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });
    
    // Update audio source if changed
    if (siteData.audio.url) {
        audio.src = siteData.audio.url;
    }
}

// Admin Panel Functions
function openAdminPanel() {
    document.getElementById('adminModal').style.display = 'block';
    if (isLoggedIn) {
        showAdminContent();
    }
}

function closeAdminPanel() {
    document.getElementById('adminModal').style.display = 'none';
}

function adminLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'Ntandoooe' && password === 'ntandomods') {
        isLoggedIn = true;
        showAdminContent();
        alert('Login successful!');
    } else {
        alert('Invalid credentials!');
    }
}

function showAdminContent() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    
    // Populate current values
    document.getElementById('editSiteTitle').value = siteData.title;
    document.getElementById('editNavLogo').value = siteData.navLogo;
    document.getElementById('editHeroTitle').value = siteData.heroTitle;
    document.getElementById('editHeroDescription').value = siteData.heroDescription;
    document.getElementById('audioUrl').value = siteData.audio.url;
    document.getElementById('audioAutoplay').value = siteData.audio.autoplay;
    
    loadExistingServices();
}

function updateSiteSettings() {
    siteData.title = document.getElementById('editSiteTitle').value;
    siteData.navLogo = document.getElementById('editNavLogo').value;
    siteData.heroTitle = document.getElementById('editHeroTitle').value;
    siteData.heroDescription = document.getElementById('editHeroDescription').value;
    
    updateSiteContent();
    saveSiteData();
    alert('Site settings updated!');
}

function addService() {
    const name = document.getElementById('serviceName').value;
    const icon = document.getElementById('serviceIcon').value;
    const description = document.getElementById('serviceDescription').value;
    const features = document.getElementById('serviceFeatures').value.split('\n').filter(f => f.trim());
    const price = document.getElementById('servicePrice').value;
    const type = document.getElementById('serviceType').value;
    
    if (!name || !description) {
        alert('Please fill in required fields!');
        return;
    }
    
    const newService = {
        id: Date.now(),
        name,
        icon,
        description,
        features,
        price,
        type
    };
    
    siteData.services.push(newService);
    loadServices();
    saveSiteData();
    
    // Clear form
    document.getElementById('serviceName').value = '';
    document.getElementById('serviceIcon').value = '';
    document.getElementById('serviceDescription').value = '';
    document.getElementById('serviceFeatures').value = '';
    document.getElementById('servicePrice').value = '';
    document.getElementById('serviceType').value = 'contact';
    
    loadExistingServices();
    alert('Service added successfully!');
}

function loadExistingServices() {
    const container = document.getElementById('existingServices');
    container.innerHTML = '';
    
    siteData.services.forEach(service => {
        const serviceDiv = document.createElement('div');
        serviceDiv.style.cssText = 'border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;';
        serviceDiv.innerHTML = `
            <h4>${service.icon} ${service.name} <span style="background: #00d4ff; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">${service.type}</span></h4>
            <p>${service.description}</p>
            <p><strong>${service.price}</strong></p>
            <button class="btn" style="background: #ff6b6b; color: white; margin-top: 10px;" onclick="deleteService(${service.id})">Delete</button>
        `;
        container.appendChild(serviceDiv);
    });
}

function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        siteData.services = siteData.services.filter(service => service.id !== id);
        loadServices();
        saveSiteData();
        loadExistingServices();
        alert('Service deleted!');
    }
}

function updateAudioSettings() {
    siteData.audio.url = document.getElementById('audioUrl').value;
    siteData.audio.autoplay = document.getElementById('audioAutoplay').value === 'true';
    
    const audio = document.getElementById('backgroundAudio');
    audio.src = siteData.audio.url;
    
    saveSiteData();
    alert('Audio settings updated!');
}

// Contact form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simulate form submission
    console.log('Form submitted:', data);
    alert('Message sent successfully! We\'ll get back to you soon.');
    e.target.reset();
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('adminModal');
    if (event.target === modal) {
        closeAdminPanel();
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSiteData();
    initAudio();
});

// Auto-save every 30 seconds
setInterval(saveSiteData, 30000);
