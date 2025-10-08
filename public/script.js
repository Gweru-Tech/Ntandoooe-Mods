// Global variables
let isLoggedIn = false;
let adminToken = null;

// API helper function
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    if (adminToken) {
        options.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    try {
        const response = await fetch(endpoint, options);
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        return { success: false, message: 'Network error' };
    }
}

// Load site data from server
async function loadSiteData() {
    const result = await apiCall('/api/admin/site-data');
    if (result.success) {
        updateSiteContent(result.data);
        loadServices(result.data.services);
    }
}

// Update site content
function updateSiteContent(data) {
    document.getElementById('site-title').textContent = data.title;
    document.getElementById('nav-logo').textContent = data.navLogo;
    document.getElementById('hero-title').textContent = data.heroTitle;
    document.getElementById('hero-description').textContent = data.heroDescription;
    document.getElementById('services-title').textContent = data.servicesTitle;
    document.getElementById('contact-title').textContent = data.contactTitle;
    document.getElementById('footer-title').textContent = data.footerTitle;
    document.getElementById('footer-description').textContent = data.footerDescription;
    document.getElementById('footer-copyright').textContent = data.footerCopyright;
}

// Load services
function loadServices(services) {
    const servicesGrid = document.getElementById('services-grid');
    const serviceSelect = document.getElementById('serviceSelect');
    
    servicesGrid.innerHTML = '';
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    
    services.forEach(service => {
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

async function adminLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const result = await apiCall('/api/admin/login', 'POST', { username, password });
    
    if (result.success) {
        isLoggedIn = true;
        adminToken = result.token;
        showAdminContent();
        alert('Login successful!');
    } else {
        alert('Invalid credentials!');
    }
}

async function showAdminContent() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    
    // Load current site data
    const result = await apiCall('/api/admin/site-data');
    if (result.success) {
        const data = result.data;
        document.getElementById('editSiteTitle').value = data.title;
        document.getElementById('editNavLogo').value = data.navLogo;
        document.getElementById('editHeroTitle').value = data.heroTitle;
        document.getElementById('editHeroDescription').value = data.heroDescription;
        document.getElementById('audioUrl').value = data.audio.url;
        document.getElementById('audioAutoplay').value = data.audio.autoplay;
        
        loadExistingServices(data.services);
    }
}

async function updateSiteSettings() {
    const data = {
        title: document.getElementById('editSiteTitle').value,
        navLogo: document.getElementById('editNavLogo').value,
        heroTitle: document.getElementById('editHeroTitle').value,
        heroDescription: document.getElementById('editHeroDescription').value
    };
    
    const result = await apiCall('/api/admin/site-settings', 'POST', data);
    
    if (result.success) {
        updateSiteContent(result.data);
        alert('Site settings updated!');
    } else {
        alert('Error updating site settings!');
    }
}

async function addService() {
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
    
    const serviceData = { name, icon, description, features, price, type };
    const result = await apiCall('/api/admin/add-service', 'POST', serviceData);
    
    if (result.success) {
        // Clear form
        document.getElementById('serviceName').value = '';
        document.getElementById('serviceIcon').value = '';
        document.getElementById('serviceDescription').value = '';
        document.getElementById('serviceFeatures').value = '';
        document.getElementById('servicePrice').value = '';
        document.getElementById('serviceType').value = 'contact';
        
        // Reload data
        loadSiteData();
        showAdminContent();
        alert('Service added successfully!');
    } else {
        alert('Error adding service!');
    }
}

function loadExistingServices(services) {
    const container = document.getElementById('existingServices');
    container.innerHTML = '';
    
    services.forEach(service => {
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

async function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        const result = await apiCall(`/api/admin/service/${id}`, 'DELETE');
        
        if (result.success) {
            loadSiteData();
            showAdminContent();
            alert('Service deleted!');
        } else {
            alert('Error deleting service!');
        }
    }
}

async function updateAudioSettings() {
    const data = {
        url: document.getElementById('audioUrl').value,
        autoplay: document.getElementById('audioAutoplay').value === 'true'
    };
    
    const result = await apiCall('/api/admin/audio-settings', 'POST', data);
    
    if (result.success) {
        const audio = document.getElementById('backgroundAudio');
        audio.src = data.url;
        alert('Audio settings updated!');
    } else {
        alert('Error updating audio settings!');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadSiteData();
    initAudio();
    
    // Admin button
    document.getElementById('adminButton').addEventListener('click', openAdminPanel);
    
    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeAdminPanel);
    
    // Login button
    document.getElementById('loginButton').addEventListener('click', adminLogin);
    
    // Update buttons
    document.getElementById('updateSiteButton').addEventListener('click', updateSiteSettings);
    document.getElementById('addServiceButton').addEventListener('click', addService);
    document.getElementById('updateAudioButton').addEventListener('click', updateAudioSettings);
    
    // Contact form
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const result = await apiCall('/api/contact', 'POST', data);
        
        if (result.success) {
            alert('Message sent successfully! We\'ll get back to you soon.');
            e.target.reset();
        } else {
            alert('Error sending message. Please try again.');
        }
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
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('adminModal');
    if (event.target === modal) {
        closeAdminPanel();
    }
}
