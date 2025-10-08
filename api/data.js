const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/site-data.json');
const CONTACTS_FILE = path.join(__dirname, '../data/contacts.json');
const ANALYTICS_FILE = path.join(__dirname, '../data/analytics.json');

// Default site data
const defaultSiteData = {
    title: "Ntando Mods Pro - Professional Modification Services",
    navLogo: "🔧 Ntando Mods Pro",
    heroTitle: "Professional Modification Services",
    heroDescription: "Transform your devices and applications with expert modifications",
    servicesTitle: "Our Services",
    contactTitle: "Get In Touch",
    footerTitle: "🔧 Ntando Mods Pro",
    footerDescription: "Professional modification services for all your digital needs.",
    footerCopyright: "© 2024 Ntando Mods Pro. All rights reserved.",
    theme: {
        primaryColor: "#00d4ff",
        secondaryColor: "#667eea",
        backgroundColor: "#f8f9fa",
        textColor: "#333"
    },
    socialLinks: {
        facebook: "",
        twitter: "",
        instagram: "",
        linkedin: "",
        github: "",
        discord: ""
    },
    seo: {
        metaDescription: "Professional modification services for mobile apps, games, and software",
        keywords: "modification, mobile apps, games, software, customization",
        ogImage: ""
    },
    services: [
        {
            id: 1,
            name: "Mobile App Mods",
            icon: "📱",
            description: "Custom modifications for Android and iOS applications with enhanced features and functionality.",
            features: ["✓ UI/UX Enhancements", "✓ Feature Additions", "✓ Performance Optimization"],
            price: "Starting from $299",
            type: "contact",
            image: "",
            popular: false
        },
        {
            id: 2,
            name: "Game Modifications",
            icon: "🎮",
            description: "Professional game modding services for enhanced gaming experiences and custom content.",
            features: ["✓ Custom Maps & Levels", "✓ Character Modifications", "✓ Gameplay Enhancements"],
            price: "Starting from $199",
            type: "contact",
            image: "",
            popular: true
        },
        {
            id: 3,
            name: "Software Customization",
            icon: "💻",
            description: "Tailored software solutions and modifications to meet your specific requirements.",
            features: ["✓ Interface Customization", "✓ Plugin Development", "✓ Integration Solutions"],
            price: "Starting from $399",
            type: "contact",
            image: "",
            popular: false
        },
        {
            id: 4,
            name: "Security Audits",
            icon: "🛡️",
            description: "Comprehensive security analysis and vulnerability assessments for your applications.",
            features: ["✓ Code Review", "✓ Penetration Testing", "✓ Security Recommendations"],
            price: "Starting from $499",
            type: "contact",
            image: "",
            popular: false
        }
    ],
    audio: {
        url: "background-music.mp3",
        autoplay: false,
        volume: 0.3
    },
    maintenance: {
        enabled: false,
        message: "We're currently performing maintenance. Please check back soon!"
    },
    announcements: [],
    testimonials: []
};

// Load data from file
const loadData = async (file, defaultData) => {
    try {
        await fs.ensureFile(file);
        const data = await fs.readJson(file);
        return { ...defaultData, ...data };
    } catch (error) {
        await fs.writeJson(file, defaultData, { spaces: 2 });
        return defaultData;
    }
};

// Save data to file
const saveData = async (file, data) => {
    try {
        await fs.writeJson(file, data, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
};

module.exports = {
    getSiteData: async () => {
        return await loadData(DATA_FILE, defaultSiteData);
    },
    
    updateSiteData: async (newData) => {
        const currentData = await loadData(DATA_FILE, defaultSiteData);
        const updatedData = { ...currentData, ...newData };
        await saveData(DATA_FILE, updatedData);
        return updatedData;
    },
    
    addService: async (service) => {
        const currentData = await loadData(DATA_FILE, defaultSiteData);
        service.id = Date.now();
        currentData.services.push(service);
        await saveData(DATA_FILE, currentData);
        return service;
    },
    
    updateService: async (id, serviceData) => {
        const currentData = await loadData(DATA_FILE, defaultSiteData);
        const index = currentData.services.findIndex(s => s.id === parseInt(id));
        if (index !== -1) {
            currentData.services[index] = { ...currentData.services[index], ...serviceData };
            await saveData(DATA_FILE, currentData);
            return currentData.services[index];
        }
        return null;
    },
    
    deleteService: async (id) => {
        const currentData = await loadData(DATA_FILE, defaultSiteData);
        currentData.services = currentData.services.filter(service => service.id !== parseInt(id));
        await saveData(DATA_FILE, currentData);
        return true;
    },
    
    saveContact: async (contactData) => {
        const contacts = await loadData(CONTACTS_FILE, []);
        const newContact = {
            id: Date.now(),
            ...contactData,
            timestamp: new Date().toISOString(),
            status: 'new'
        };
        contacts.push(newContact);
        await saveData(CONTACTS_FILE, contacts);
        return newContact;
    },
    
    getContacts: async () => {
        return await loadData(CONTACTS_FILE, []);
    },
    
    updateContactStatus: async (id, status) => {
        const contacts = await loadData(CONTACTS_FILE, []);
        const index = contacts.findIndex(c => c.id === parseInt(id));
        if (index !== -1) {
            contacts[index].status = status;
            await saveData(CONTACTS_FILE, contacts);
            return contacts[index];
        }
        return null;
    },
    
    logAnalytics: async (event, data) => {
        const analytics = await loadData(ANALYTICS_FILE, []);
        analytics.push({
            event,
            data,
            timestamp: new Date().toISOString(),
            ip: data.ip || 'unknown'
        });
        // Keep only last 1000 entries
        if (analytics.length > 1000) {
            analytics.splice(0, analytics.length - 1000);
        }
        await saveData(ANALYTICS_FILE, analytics);
    },
    
    getAnalytics: async () => {
        return await loadData(ANALYTICS_FILE, []);
    }
};
