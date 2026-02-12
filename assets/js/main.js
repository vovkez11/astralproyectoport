/* Olio Theme Scripts */
console.log('[main.js] Main.js file loaded');
// Robust preloader hide (vanilla JS, independent of jQuery)
(function(){
var hasHiddenPreloader = false;
function hidePreloader() {
    if (hasHiddenPreloader) return;
    hasHiddenPreloader = true;
    try { document.body.classList.add('loaded'); } catch(e) {}
    var pre = document.querySelector('.site-preloader-wrap');
    if (pre) {
        pre.style.opacity = '0';
        pre.style.visibility = 'hidden';
        pre.style.display = 'none';
    }
}
function scheduleHides() {
    setTimeout(hidePreloader, 100);
    setTimeout(hidePreloader, 1200);
    setTimeout(hidePreloader, 3500);
}
if (document.readyState === 'complete') {
    hidePreloader();
    scheduleHides();
} else {
    document.addEventListener('DOMContentLoaded', scheduleHides, { once: true });
    window.addEventListener('load', hidePreloader, { once: true });
    window.addEventListener('pageshow', function(){ setTimeout(hidePreloader, 100); }, { once: true });
}
})();
(function($){ "use strict";
    $(window).on('load', function() {
        console.log('[main.js] Window loaded, adding loaded class to body');
        $('body').addClass('loaded');
    });
    // Fallback preloader timeout to ensure it doesn't stay visible too long
    setTimeout(function() {
        console.log('[main.js] Preloader timeout reached, forcing loaded class');
        $('body').addClass('loaded');
    }, 4000); // Force hide preloader after 4 seconds maximum
	
	// Ensure header functionality works - fallback for timing issues
	setTimeout(function() {
		if (typeof $ !== 'undefined' && $('#header').length > 0) {
			var header = $("#header");
			if (!header.hasClass('navbar-fixed-top') && $(window).scrollTop() >= 80) {
				header.addClass("navbar-fixed-top");
				console.log('[main.js] Fallback: Added navbar-fixed-top class to header');
			}
		}
	}, 1000);
	
	// Sticky Header
	$(function() {
		var header = $("#header");
		console.log('[main.js] Header element found:', header.length > 0);
		
		if (header.length > 0) {
			var yOffset = 0,
				triggerPoint = 80;
			$(window).on( 'scroll', function() {
				yOffset = $(window).scrollTop();
				if (yOffset >= triggerPoint) {
					header.addClass("navbar-fixed-top");
					console.log('[main.js] Header scrolled - added navbar-fixed-top class');
				} else {
					header.removeClass("navbar-fixed-top");
					console.log('[main.js] Header at top - removed navbar-fixed-top class');
				}
			});
		}
		
		// WOW Active
		console.log('[main.js] Initializing WOW animations');
		if (typeof WOW !== 'undefined') {
			new WOW().init();
			console.log('[main.js] WOW animations initialized');
		} else {
			console.warn('[main.js] WOW library not found');
		}
		
		// Portfolio Images Population
		console.log('[main.js] About to call populatePortfolio()');
		populatePortfolio();
		
		// Initialize smoothscroll plugin
		smoothScroll.init({
			offset: 60,
			speed: 800,
			easing: 'easeInOutCubic'
		});
		
		// Mobile Navigation
		initMobileNav();
		
		// Social Icons Population
		populateSocialIcons();
		
		// Contact Form Visibility
		updateContactFormVisibility();
	});
	// IndexedDB utility for portfolio images
	const portfolioDB = (function() {
		const DB_NAME = 'PortfolioDB';
		const STORE_NAME = 'portfolioImages';
		const DB_VERSION = 1;
		let db = null;
		function openDB() {
			return new Promise((resolve, reject) => {
				if (db) return resolve(db);
				const request = indexedDB.open(DB_NAME, DB_VERSION);
				request.onupgradeneeded = function(e) {
					const db = e.target.result;
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
					}
				};
				request.onsuccess = function(e) {
					db = e.target.result;
					resolve(db);
				};
				request.onerror = function(e) {
					reject(e);
				};
			});
		}
		async function addPortfolioImage(imageData) {
			const db = await openDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				const req = store.add(imageData);
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
		}
		async function getAllPortfolioImages() {
			const db = await openDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readonly');
				const store = tx.objectStore(STORE_NAME);
				const req = store.getAll();
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
		}
		async function removePortfolioImage(id) {
			const db = await openDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				const req = store.delete(id);
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			});
		}
		async function clearPortfolioImages() {
			const db = await openDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				const req = store.clear();
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			});
		}
		return {
			addPortfolioImage,
			getAllPortfolioImages,
			removePortfolioImage,
			clearPortfolioImages
		};
	})();
	async function populatePortfolio() {
		console.log('[populatePortfolio] Starting portfolio population...');
		console.log('[populatePortfolio] window.disableAutoPortfolio:', window.disableAutoPortfolio);

		// Check if auto-portfolio population is disabled
		if (window.disableAutoPortfolio) {
			console.log('[populatePortfolio] Auto-portfolio population is disabled, skipping...');
			return;
		}

		var portfolioContainer = $('.portfolio-items');
		console.log('[populatePortfolio] Portfolio container found:', portfolioContainer.length > 0);

		if (portfolioContainer.length === 0) {
			console.error('[populatePortfolio] No portfolio container found!');
			return;
		}

		portfolioContainer.empty();

		// Helper: build + append items
		function renderItems(items) {
			items.forEach((item, index) => {
				var src = item.src;
				if (!src) return;

				var title = item.title || ('Portfolio ' + (item.number || (index + 1)));
				var desc = item.desc || '';

				var portfolioItem = `
					<div class="col-lg-3 col-sm-6">
						<div class="portfolio-box wow fadeInUp" data-wow-duration="0.6s" data-wow-delay="${(index * 0.1).toFixed(1)}s">
							<div class="portfolio-thumb">
								<img src="${src}" alt="${title}" loading="lazy">
							</div>
							<a href="${src}" class="hover img-popup" data-gall="galleryimg" data-title="${title}${desc ? ' — ' + desc : ''}"></a>
						</div>
					</div>
				`;
				portfolioContainer.append(portfolioItem);
			});

			// Re-init lightbox after images are in the DOM
			setTimeout(function() {
				reinitializeVenobox();
			}, 250);
		}

		// 1) Preferred mode: load manifest if present
		try {
			var manifestRes = await fetch('portfolio/manifest.json', { cache: 'no-store' });
			if (manifestRes.ok) {
				var manifest = await manifestRes.json();

				// Normalize: allow ["path.jpg", ...] or [{src, title, desc}, ...]
				if (Array.isArray(manifest)) {
					var normalized = manifest.map((x, i) => {
						if (typeof x === 'string') return { src: x, title: 'Portfolio ' + (i + 1) };
						if (x && typeof x === 'object') return x;
						return null;
					}).filter(Boolean);

					if (normalized.length > 0) {
						console.log('[populatePortfolio] Loaded manifest items:', normalized.length);
						renderItems(normalized);
						return;
					}
				}
				console.warn('[populatePortfolio] Manifest found but empty/invalid, falling back to numeric scan...');
			} else {
				console.log('[populatePortfolio] No manifest.json found (HTTP', manifestRes.status, '), falling back to numeric scan...');
			}
		} catch (e) {
			console.warn('[populatePortfolio] Manifest load failed, falling back to numeric scan:', e);
		}

		// 2) Fallback mode: numeric scan (001..N) with gap tolerance + multiple extensions
		var maxImages = 250;         // upper bound on index attempts
		var missLimit = 60;          // stop after this many misses in a row (after first hit)
		var exts = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'];
		var foundAny = false;
		var missesInARow = 0;
		var items = [];

		function imageExists(src) {
			return new Promise((resolve) => {
				var img = new Image();
				img.onload = function() { resolve(true); };
				img.onerror = function() { resolve(false); };
				img.src = src;
			});
		}

		console.log('[populatePortfolio] Starting numeric scan from index 1...');

		for (var index = 1; index <= maxImages; index++) {
			var imageNumber = index.toString().padStart(3, '0');

			var matched = false;
			for (var ei = 0; ei < exts.length; ei++) {
				var candidate = 'portfolio/' + imageNumber + exts[ei];
				// eslint-disable-next-line no-await-in-loop
				var ok = await imageExists(candidate);
				if (ok) {
					items.push({ src: candidate, number: imageNumber, title: 'Portfolio ' + imageNumber });
					matched = true;
					foundAny = true;
					missesInARow = 0;
					break;
				}
			}

			if (!matched) {
				if (foundAny) {
					missesInARow++;
					if (missesInARow >= missLimit) {
						console.log('[populatePortfolio] Miss limit reached, stopping scan at index', index);
						break;
					}
				}
			}
		}

		if (items.length > 0) {
			console.log('[populatePortfolio] Numeric scan found items:', items.length);
			renderItems(items);
		} else {
			console.warn('[populatePortfolio] No portfolio images found. Create portfolio/manifest.json or add 001.jpg etc.');
		}
	}
	// Function to reinitialize venobox with proper cleanup
	function reinitializeVenobox() {
		if (window.jQuery && window.jQuery.fn.venobox) {
			console.log('[reinitializeVenobox] Reinitializing venobox');
			try {
				// Destroy existing venobox instances first
				window.jQuery('.img-popup').off('click').removeData('venobox');
				window.jQuery('.img-popup').off('click.venobox');
				// Remove any existing venobox data
				window.jQuery('.img-popup').removeAttr('data-venobox');
				// Initialize venobox with proper options
				window.jQuery('.img-popup').venobox({
					numeratio: true,
					infinigall: true,
					preloader: 'spinner',
					spinner: 'rotating-plane',
					closeBackground: true,
					closeColor: '#fff',
					closeButton: true,
					overlayColor: 'rgba(0,0,0,0.85)',
					titleattr: 'data-title',
					titlePosition: 'top'
				});
				console.log('[reinitializeVenobox] Venobox reinitialized successfully');
			} catch (error) {
				console.error('[reinitializeVenobox] Error reinitializing venobox:', error);
				// Fallback to simple lightbox if venobox fails
				setupFallbackLightbox();
			}
		} else {
			console.warn('[reinitializeVenobox] jQuery or venobox not available, using fallback');
			setupFallbackLightbox();
		}
	}
	// Fallback lightbox implementation
	function setupFallbackLightbox() {
		console.log('[setupFallbackLightbox] Setting up fallback lightbox');
		// Remove any existing click handlers
		$('.img-popup').off('click.fallback');
		// Add fallback click handler
		$('.img-popup').on('click.fallback', function(e) {
			e.preventDefault();
			var imgSrc = $(this).attr('href');
			var imgAlt = $(this).find('img').attr('alt') || 'Portfolio Image';
			// Create lightbox overlay
			var lightbox = $('<div class="fallback-lightbox" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: pointer;"></div>');
			// Create image element
			var img = $('<img src="' + imgSrc + '" alt="' + imgAlt + '" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 4px;">');
			// Add close button
			var closeBtn = $('<div style="position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer; z-index: 10000;">&times;</div>');
			// Add to page
			lightbox.append(img).append(closeBtn);
			$('body').append(lightbox);
			// Close on click
			lightbox.on('click', function() {
				lightbox.remove();
			});
			// Close on escape key
			$(document).on('keydown.fallback', function(e) {
				if (e.keyCode === 27) { // ESC key
					lightbox.remove();
					$(document).off('keydown.fallback');
				}
			});
		});
	}
	// Global function to reinitialize venobox (can be called from builder)
	// This function is used by the builder to ensure lightbox works properly
	// when portfolio images are dynamically loaded or updated
	window.reinitializePortfolioLightbox = function() {
		console.log('[reinitializePortfolioLightbox] Global function called');
		reinitializeVenobox();
	};
	
	// Mobile Menu
	// Using custom mobile navigation - slicknav removed for performance
	// Active venobox - Safari Compatible
	// Safari-compatible venobox initialization
	function initVenobox() {
		if (window.jQuery && window.jQuery.fn.venobox) {
			try {
				console.log('[main.js] Initializing venobox');
				// Remove any existing venobox instances first
				$('.img-popup').off('click').removeData('venobox');
				$('.img-popup').off('click.venobox');
				$('.img-popup').venobox({
					numeratio: true,
					infinigall: true,
					preloader: 'spinner',
					spinner: 'rotating-plane',
					closeBackground: true,
					closeColor: '#fff',
					closeButton: true,
					overlayColor: 'rgba(0,0,0,0.85)',
					titleattr: 'data-title',
					titlePosition: 'top'
				});
				console.log('[main.js] Venobox initialized successfully');
			} catch (error) {
				console.error('[main.js] Error initializing venobox:', error);
			}
		} else {
			console.warn('[main.js] jQuery or venobox not available, using fallback');
		}
	}
	// Initialize venobox after DOM is ready and after portfolio population
	$(document).ready(function() {
		// Initial venobox initialization for any existing elements
		setTimeout(initVenobox, 500);
		// Additional initialization after portfolio population
		$(window).on('load', function() {
			setTimeout(initVenobox, 1500);
		});
	});
	
	// Scroll To Top
    $(window).on( 'scroll', function () {
        if ($(this).scrollTop() > 100) {
            $('#scroll-to-top').fadeIn();
        } else {
            $('#scroll-to-top').fadeOut();
        }
    });
	function initMobileNav() {
		var hamburger = $('.hamburger-menu');
		var mobileNav = $('.mobile-nav-overlay');
		var mobileNavLinks = $('.mobile-nav-link');
		// Toggle mobile menu
		hamburger.on('click', function() {
			hamburger.toggleClass('active');
			mobileNav.toggleClass('active');
			$('body').toggleClass('nav-open');
		});
		// Close mobile menu when clicking on a link
		mobileNavLinks.on('click', function() {
			hamburger.removeClass('active');
			mobileNav.removeClass('active');
			$('body').removeClass('nav-open');
		});
		// Close mobile menu when clicking outside
		mobileNav.on('click', function(e) {
			if (e.target === this) {
				hamburger.removeClass('active');
				mobileNav.removeClass('active');
				$('body').removeClass('nav-open');
			}
		});
		// Close mobile menu on scroll
		$(window).on('scroll', function() {
			if (mobileNav.hasClass('active')) {
				hamburger.removeClass('active');
				mobileNav.removeClass('active');
				$('body').removeClass('nav-open');
			}
		});
	}
	function populateSocialIcons() {
		// Get social media links from portfolioConfig in localStorage
		var portfolioConfig = localStorage.getItem('portfolioConfig');
		var config = {};
		if (portfolioConfig) {
			try {
				config = JSON.parse(portfolioConfig);
			} catch (e) {
				console.log('Error parsing portfolioConfig:', e);
			}
		}
		var socialIconsHTML = '';
		// Only add social icons if a link is provided
		if (config.facebookLink && config.facebookLink.trim()) {
			socialIconsHTML += '<li><a href="' + config.facebookLink + '" target="_blank" rel="noopener"><i class="fa fa-facebook"></i></a></li>';
		}
		if (config.xLink && config.xLink.trim()) {
			socialIconsHTML += '<li><a href="' + config.xLink + '" target="_blank" rel="noopener"><i class="fa fa-twitter"></i></a></li>';
		}
		if (config.instagramLink && config.instagramLink.trim()) {
			socialIconsHTML += '<li><a href="' + config.instagramLink + '" target="_blank" rel="noopener"><i class="fa fa-instagram"></i></a></li>';
		}
		if (config.emailAddress && config.emailAddress.trim()) {
			socialIconsHTML += '<li><a href="mailto:' + config.emailAddress + '"><i class="fa fa-envelope"></i></a></li>';
		}
		// Only update the HTML if at least one social link is present
		if (socialIconsHTML.trim().length > 0) {
			$('.nav-social').html(socialIconsHTML);
			$('.social-link').html(socialIconsHTML);
			$('.mobile-social').html(socialIconsHTML);
		}
	}
	function updateContactFormVisibility() {
		// Get contact option from localStorage
		var portfolioConfig = localStorage.getItem('portfolioConfig');
		var config = {};
		if (portfolioConfig) {
			try {
				config = JSON.parse(portfolioConfig);
			} catch (e) {
				console.log('Error parsing portfolioConfig:', e);
			}
		}
		var contactOption = config.contactFormType || 'formspree';
		if (contactOption === 'disable') {
			$('.contact-section').addClass('no-form');
			$('.contact-form').addClass('hidden');
		} else {
			$('.contact-section').removeClass('no-form');
			$('.contact-form').removeClass('hidden');
		}
	}
	function previewChanges() {
		saveSettings();
		showStatusMessage('Opening preview in new tab...', 'info');
		window.open('preview.html', '_blank');
	}
    /*====================================================================
        Disable Local-Storage and IndexedDB Access for Exported Sites
    *====================================================================*/
    (function(){
        // Builder runs on these hostnames; everywhere else is considered an exported build.
        var builderHosts = [
            'tattoostudiopro.com',
            'localhost',
            '127.0.0.1'
        ];
        var isBuilderEnv = builderHosts.indexOf(window.location.hostname) !== -1;
        var isPreview = window.location.pathname.endsWith('preview.html');
        // Only disable storage for true exported builds (not builder, not preview)
        if (!isBuilderEnv && !isPreview) {
            try {
                // Stub out localStorage.getItem so any attempt to read preview data simply returns null.
                console.log('[main.js] Exported build detected – disabling localStorage access');
                if (window.localStorage) {
                    window.localStorage.getItem = function(){ return null; };
                }
                // Disable IndexedDB access for exported builds
                console.log('[main.js] Exported build detected – disabling IndexedDB access');
                if (window.indexedDB) {
                    // Override the portfolioDB functions to prevent IndexedDB access
                    if (typeof portfolioDB !== 'undefined') {
                        portfolioDB.getAllPortfolioImages = function() {
                            return Promise.resolve([]);
                        };
                        portfolioDB.addPortfolioImage = function() {
                            return Promise.resolve();
                        };
                        portfolioDB.removePortfolioImage = function() {
                            return Promise.resolve();
                        };
                        portfolioDB.clearPortfolioImages = function() {
                            return Promise.resolve();
                        };
                    }
                }
            } catch(e) {
                console.warn('[main.js] Failed to override storage access:', e);
            }
        }
    })();
})(jQuery);
