document.addEventListener('DOMContentLoaded', () => {
    // Initialize QR Code
    const qrcodeContainer = document.getElementById("qrcode");
    if (qrcodeContainer) {
        new QRCode(qrcodeContainer, {
            text: "https://www.cascade5star.com/booking",
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
            navbar.style.padding = '0px 40px';
        } else {
            navbar.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)';
            navbar.style.padding = '0px 40px';
        }
    });

    // Mobile Menu (Simple toggle)
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'rgba(0,0,0,0.95)';
                navLinks.style.padding = '20px';
            }
        });
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.experience-card, .promo-card, .services-info, .services-image, .calculator-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });

    // --- Fare Calculator Logic ---
    const pickupInput = document.getElementById('pickup-input');
    const dropoffInput = document.getElementById('dropoff-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('calculator-result');
    const resultDistance = document.getElementById('result-distance');
    const resultTime = document.getElementById('result-time');
    const resultFare = document.getElementById('result-fare');

    let calculatorInitialized = false;

    const initCalculator = () => {
        if (typeof google === 'undefined' || !google.maps) {
            setTimeout(initCalculator, 300);
            return;
        }
        if (calculatorInitialized) return;
        calculatorInitialized = true;

        // Custom Pricing Formula (TODO: Adjust based on user needs)
        const BASE_FARE = 0;
        const PER_MILE = 2.50;
        const PER_MINUTE = 0;
        const MINIMUM_FARE = 0;

        calculateBtn.addEventListener('click', () => {
            const origin = pickupInput.value;
            const destination = dropoffInput.value;

            if (!origin || !destination) {
                alert("Please enter both pickup and drop-off locations.");
                return;
            }

            calculateBtn.textContent = 'Calculating...';
            calculateBtn.disabled = true;

            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            }, (response, status) => {
                calculateBtn.textContent = 'Calculate Fare';
                calculateBtn.disabled = false;

                if (status === 'OK') {
                    const results = response.rows[0].elements[0];
                    if (results.status === 'OK') {
                        const distanceText = results.distance.text;
                        const timeText = results.duration.text;
                        
                        // Distance in miles (remove ' mi' and commas)
                        const distanceMiles = parseFloat(results.distance.text.replace(/[^0-9.]/g, ''));
                        // Duration in minutes
                        const durationMins = Math.round(results.duration.value / 60);

                        // Calculate fare
                        let calculatedFare = BASE_FARE + (distanceMiles * PER_MILE) + (durationMins * PER_MINUTE);
                        if (calculatedFare < MINIMUM_FARE) {
                            calculatedFare = MINIMUM_FARE;
                        }

                        // Update UI
                        resultDistance.textContent = distanceText;
                        resultTime.textContent = timeText;
                        resultFare.textContent = '$' + calculatedFare.toFixed(2);
                        
                        resultContainer.classList.remove('hidden');
                    } else {
                        alert("Could not calculate driving distance between these locations.");
                    }
                } else {
                    alert("Error communicating with routing service. Please try again later.");
                }
            });
        });
    };

    if (pickupInput && dropoffInput) {
        initCalculator();
    }
});
