document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.remove('no-js');
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Noise canvas initialization 
  const noiseCanvas = document.getElementById('noise-canvas');
  if (noiseCanvas) {
    const ctx = noiseCanvas.getContext('2d');
    const w = noiseCanvas.width = 128;
    const h = noiseCanvas.height = 128;
    const idata = ctx.createImageData(w, h);
    const data = new Uint32Array(idata.data.buffer);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() < 0.1) ? 0x08ffffff : 0x00000000;
    }
    ctx.putImageData(idata, 0, 0);
    
    noiseCanvas.style.backgroundImage = `url(${noiseCanvas.toDataURL()})`;
    noiseCanvas.style.backgroundRepeat = 'repeat';
    ctx.clearRect(0,0,w,h);
  }

  if (!hasGSAP) {
    console.warn('GSAP not loaded, using fallback scroll');
    document.body.classList.add('fallback-mode');
    
    const revealElements = document.querySelectorAll('.reveal');
    if (prefersReducedMotion) {
      revealElements.forEach(el => el.classList.add('active'));
    } else {
      const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      revealElements.forEach(el => observer.observe(el));
    }
  } else {
    // GSAP is available
    const revealElements = document.querySelectorAll('.reveal');
    
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ force3D: true, storage: null });

    // Enhanced Parallax: Scroll-based with higher sensitivity
    if (!prefersReducedMotion) {
      // Wrapper parallax (main elements)
      document.querySelectorAll('.scroll-parallax-wrapper[data-scroll-speed]').forEach((wrapper) => {
        const speed = parseFloat(wrapper.getAttribute('data-scroll-speed') || '0');
        if (!Number.isFinite(speed) || speed === 0) return;

        const trigger = wrapper.closest('section') || wrapper;
        gsap.to(wrapper, {
          y: speed * 300,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

      // Section background parallax (subtle movement)
      document.querySelectorAll('section').forEach((section, index) => {
        const bgElements = section.querySelectorAll('.absolute:not(.parallax-layer):not(.scroll-parallax-wrapper)');
        
        bgElements.forEach((el) => {
          if (el.classList.contains('blur-3xl') || el.classList.contains('blur-\\[120px\\]')) {
            gsap.fromTo(el, 
              { y: -50 },
              {
                y: 50,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true
                }
              }
            );
          }
        });
      });

      // Enhanced parallax for cards and images
      document.querySelectorAll('[data-parallax-y]:not(.parallax-layer)').forEach((el) => {
        const amount = parseFloat(el.getAttribute('data-parallax-y') || '0');
        if (!Number.isFinite(amount) || amount === 0) return;

        const trigger = el.closest('section') || el;
        gsap.fromTo(
          el,
          { y: -amount },
          {
            y: amount,
            ease: 'none',
            scrollTrigger: {
              trigger,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      });
    }

    // Section animations
    revealElements.forEach((el, i) => {
      if (!prefersReducedMotion) {
        const isParallaxElement = el.hasAttribute('data-parallax-y');

        gsap.fromTo(el,
          isParallaxElement ? { opacity: 0 } : { opacity: 0, y: 60 },
          {
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'bottom 15%',
              toggleActions: 'play none none reverse'
            },
            opacity: 1,
            ...(isParallaxElement ? {} : { y: 0 }),
            duration: 1,
            ease: 'power3.out',
            delay: (i % 3) * 0.1
          }
        );
      } else {
        gsap.set(el, { opacity: 1, y: 0 });
      }

      el.classList.remove('reveal');
    });

    if (!prefersReducedMotion) {
      // Hero Titles with enhanced reveal
      const titleLines = document.querySelectorAll('.hero-title-wrapper');
      gsap.to(titleLines, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        y: 0,
        duration: 1.4,
        stagger: 0.2,
        ease: 'power4.out',
        delay: 0.2
      });

      // Image Scaling with enhanced parallax
      document.querySelectorAll('.gsap-img-scale').forEach(img => {
        img.style.willChange = 'transform';
        
        // Scale down from larger size
        gsap.fromTo(img, 
          { scale: 1.4 },
          {
            scrollTrigger: {
              trigger: img.closest('.gsap-image-scale'),
              start: 'top 85%',
              end: 'bottom 15%',
              scrub: 0.5
            },
            scale: 1,
            ease: 'none'
          }
        );
      });

      // All Section Titles with enhanced animation
      const sectionHeadings = document.querySelectorAll('h2');
      sectionHeadings.forEach(heading => {
        const lines = heading.querySelectorAll('.scroll-title-wrapper');
        if (lines.length > 0) {
          gsap.to(lines, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            y: 0,
            duration: 1.4,
            stagger: 0.15,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: heading,
              start: 'top 95%',
              toggleActions: 'play none none reverse'
            }
          });
        }
      });

      // Enhanced horizontal card movement on scroll
      gsap.utils.toArray('section').forEach((section, i) => {
        const cards = section.querySelectorAll('.group');
        cards.forEach((card, j) => {
          if (!card.closest('.parallax-layer')) {
            gsap.fromTo(card,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 90%',
                  toggleActions: 'play none none reverse'
                },
                delay: j * 0.1
              }
            );
          }
        });
      });
    }
  }

  // Enhanced Mouse Parallax with higher sensitivity
  if (!prefersReducedMotion) {
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - windowHalfX);
      mouseY = (e.clientY - windowHalfY);
    });

    function animateParallax() {
      // Smooth interpolation
      targetX += (mouseX - targetX) * 0.06;
      targetY += (mouseY - targetY) * 0.06;

      // Apply to all parallax layers with varying intensity
      document.querySelectorAll('.parallax-layer').forEach(layer => {
        const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
        const x = targetX * speed;
        const y = targetY * speed;
        
        // Add subtle rotation based on movement
        const rotateX = targetY * speed * 0.02;
        const rotateY = targetX * speed * 0.02;
        
        layer.style.transform = `translate3d(${x}px, ${y}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      // Apply to key headlines in hero
      document.querySelectorAll('h1 .hero-title-wrapper').forEach(title => {
        const x = targetX * 0.008;
        const y = targetY * 0.008;
        title.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });

      requestAnimationFrame(animateParallax);
    }
    
    animateParallax();
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Mobile Navigation Toggle
  const mobileNavToggle = document.querySelector('[data-mobile-nav-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const mobileNavClose = document.querySelector('[data-mobile-nav-close]');

  if (mobileNavToggle && mobileNav) {
    mobileNavToggle.addEventListener('click', () => {
      mobileNav.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener('click', () => {
      mobileNav.classList.add('translate-x-full');
      document.body.style.overflow = '';
    });
  }

  // Close mobile nav on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.add('translate-x-full');
        document.body.style.overflow = '';
      });
    });
  }

  // Set active navigation state
  const setActiveNav = () => {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const currentHash = window.location.hash;
    
    // Desktop nav
    const desktopNav = document.querySelector('header nav');
    if (desktopNav) {
      desktopNav.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        let isActive = false;
        
        if (href === 'index.html' && (currentPath === 'index.html' || currentPath === '')) {
          isActive = true;
        } else if ((href === 'explore.html' || href === 'cause.html') && (currentPath === 'explore.html' || currentPath === 'cause.html')) {
          isActive = true;
        } else if (href.startsWith('#') && href === currentHash && currentPath === 'index.html') {
          isActive = true;
        }
        
        if (isActive) {
          link.classList.remove('text-zinc-400', 'hover:text-zinc-950', 'font-medium');
          link.classList.add('text-zinc-950', 'font-semibold', 'border-b-2', 'border-zinc-950');
          link.style.borderBottom = '2px solid currentColor';
        }
      });
    }
    
    // Mobile nav
    const mobileNavEl = document.querySelector('[data-mobile-nav]');
    if (mobileNavEl) {
      mobileNavEl.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        let isActive = false;
        
        if (href === 'index.html' && (currentPath === 'index.html' || currentPath === '')) {
          isActive = true;
        } else if ((href === 'explore.html' || href === 'cause.html') && (currentPath === 'explore.html' || currentPath === 'cause.html')) {
          isActive = true;
        } else if (href.startsWith('#') && href === currentHash && currentPath === 'index.html') {
          isActive = true;
        }
        
        if (isActive) {
          link.classList.remove('text-zinc-300', 'hover:text-lime-400', 'font-medium');
          link.classList.add('text-lime-400', 'font-semibold');
        }
      });
    }
  };

  setActiveNav();
});
