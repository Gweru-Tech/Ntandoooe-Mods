// In-memory data store (in production, use a database)
let siteData = {
    title: "Ntando Mods Pro - Professional Modification Services",
    navLogo: "🔧 Ntando Mods Pro",
    heroTitle: "Professional Modification Services",
    heroDescription: "Transform your devices and applications with expert modifications",
    servicesTitle: "Our Services",
    contactTitle: "Get In Touch",
    footerTitle: "🔧 Ntando Mods Pro",
    footerDescription: "Professional modification services for all your digital needs.",
    footerCopyright: "© 2024 Ntando Mods Pro. All rights reserved.",
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

module.exports = {
    getSiteData: () => siteData,
    updateSiteData: (newData) => {
        siteData = { ...siteData, ...newData };
        return siteData;
    },
    addService: (service) => {
        service.id = Date.now();
        siteData.services.push(service);
        return service;
    },
    deleteService: (id) => {
        siteData.services = siteData.services.filter(service => service.id !== parseInt(id));
        return true;
    }
};
