// Cards Carousel - Infinite Mobile Slider
(function() {
  'use strict';

  /**
   * Initialize cards carousel
   * @param {HTMLElement} carousel - The carousel container element
   */
  function initCardsCarousel(carousel) {
    if (!carousel) return;
    
    var wrapper = carousel.querySelector('.swiper-wrapper');
    var originalSlides = carousel.querySelectorAll('.swiper-slide:not(.swiper-slide-clone)');
    
    if (!wrapper || originalSlides.length === 0) return;
    
    // Only apply infinite scroll on mobile
    if (window.innerWidth < 768) {
      setupInfiniteScroll(wrapper, originalSlides);
    }
  }
  
  /**
   * Setup infinite scroll for mobile
   * @param {HTMLElement} wrapper - The wrapper element
   * @param {NodeListOf<Element>} originalSlides - The original slide elements
   */
  function setupInfiniteScroll(wrapper, originalSlides) {
    // Remove existing clones
    var existingClones = wrapper.querySelectorAll('.swiper-slide-clone');
    existingClones.forEach(function(clone) {
      clone.remove();
    });
    
    var slideArray = Array.from(originalSlides);
    var cloneCount = slideArray.length;
    
    // Create clones before and after
    var beforeFragment = document.createDocumentFragment();
    var afterFragment = document.createDocumentFragment();
    
    slideArray.forEach(function(slide) {
      var cloneBefore = slide.cloneNode(true);
      var cloneAfter = slide.cloneNode(true);
      cloneBefore.classList.add('swiper-slide-clone');
      cloneAfter.classList.add('swiper-slide-clone');
      cloneBefore.setAttribute('aria-hidden', 'true');
      cloneAfter.setAttribute('aria-hidden', 'true');
      beforeFragment.appendChild(cloneBefore);
      afterFragment.appendChild(cloneAfter);
    });
    
    wrapper.insertBefore(beforeFragment, wrapper.firstChild);
    wrapper.appendChild(afterFragment);
    
    // Get slide width (including margins)
    var allSlides = wrapper.querySelectorAll('.swiper-slide');
    var firstSlide = allSlides[0];
    var slideWidth = firstSlide ? firstSlide.offsetWidth + 20 : 0; // width + gap
    
    // Set initial position to first real slide
    wrapper.style.scrollBehavior = 'auto';
    wrapper.scrollLeft = slideWidth * cloneCount;
    
    var isDown = false;
    var startX = 0;
    var scrollLeft = 0;
    var velocity = 0;
    var lastX = 0;
    var lastTime = Date.now();
    var animationFrame = null;
    var isAdjusting = false;
    
    /**
     * Start dragging
     * @param {MouseEvent|TouchEvent} e - Event object
     */
    function startDragging(e) {
      if (isAdjusting) return;
      
      isDown = true;
      wrapper.style.scrollBehavior = 'auto';
      
      var pageX = e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
      startX = pageX - wrapper.offsetLeft;
      scrollLeft = wrapper.scrollLeft;
      lastX = pageX;
      lastTime = Date.now();
      velocity = 0;
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    }
    
    /**
     * While dragging
     * @param {MouseEvent|TouchEvent} e - Event object
     */
    function whileDragging(e) {
      if (!isDown || isAdjusting) return;
      e.preventDefault();
      
      var pageX = e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
      var x = pageX - wrapper.offsetLeft;
      var walk = (x - startX) * 1.2;
      wrapper.scrollLeft = scrollLeft - walk;
      
      var currentTime = Date.now();
      var timeDelta = currentTime - lastTime;
      
      if (timeDelta > 0) {
        velocity = (pageX - lastX) / timeDelta;
      }
      
      lastX = pageX;
      lastTime = currentTime;
      
      checkInfiniteWrap();
    }
    
    /**
     * Stop dragging
     * @param {MouseEvent|TouchEvent} e - Event object
     */
    function stopDragging(e) {
      if (!isDown) return;
      isDown = false;
      
      if (Math.abs(velocity) > 0.3) {
        applyMomentum();
      } else {
        wrapper.style.scrollBehavior = 'smooth';
        snapToNearestSlide();
      }
    }
    
    /**
     * Apply momentum
     */
    function applyMomentum() {
      var decay = 0.95;
      var minVelocity = 0.1;
      
      function animate() {
        if (isAdjusting) return;
        
        velocity *= decay;
        
        if (Math.abs(velocity) > minVelocity) {
          wrapper.scrollLeft -= velocity * 16;
          checkInfiniteWrap();
          animationFrame = requestAnimationFrame(animate);
        } else {
          wrapper.style.scrollBehavior = 'smooth';
          snapToNearestSlide();
        }
      }
      
      animate();
    }
    
    /**
     * Check and wrap for infinite scroll
     */
    function checkInfiniteWrap() {
      if (isAdjusting) return;
      
      var currentScroll = wrapper.scrollLeft;
      var totalWidth = slideWidth * cloneCount;
      
      // Scrolled past right clones
      if (currentScroll >= totalWidth * 2) {
        isAdjusting = true;
        wrapper.style.scrollBehavior = 'auto';
        wrapper.scrollLeft = currentScroll - totalWidth;
        setTimeout(function() {
          isAdjusting = false;
        }, 50);
      }
      
      // Scrolled past left clones
      if (currentScroll <= 0) {
        isAdjusting = true;
        wrapper.style.scrollBehavior = 'auto';
        wrapper.scrollLeft = currentScroll + totalWidth;
        setTimeout(function() {
          isAdjusting = false;
        }, 50);
      }
    }
    
    /**
     * Snap to nearest slide
     */
    function snapToNearestSlide() {
      var scrollPosition = wrapper.scrollLeft;
      var nearestIndex = Math.round(scrollPosition / slideWidth);
      var targetScroll = nearestIndex * slideWidth;
      
      wrapper.style.scrollBehavior = 'smooth';
      wrapper.scrollLeft = targetScroll;
      
      setTimeout(function() {
        checkInfiniteWrap();
      }, 350);
    }
    
    // Event listeners
    wrapper.addEventListener('mousedown', startDragging);
    wrapper.addEventListener('mousemove', whileDragging);
    wrapper.addEventListener('mouseup', stopDragging);
    wrapper.addEventListener('mouseleave', stopDragging);
    wrapper.addEventListener('touchstart', startDragging, { passive: false });
    wrapper.addEventListener('touchmove', whileDragging, { passive: false });
    wrapper.addEventListener('touchend', stopDragging);
    wrapper.addEventListener('dragstart', function(e) {
      e.preventDefault();
    });
    
    // Scroll listener
    var scrollTimeout = null;
    wrapper.addEventListener('scroll', function() {
      if (!isDown && !isAdjusting) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          checkInfiniteWrap();
        }, 100);
      }
    });
    
    // Resize handler
    var resizeTimeout = null;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (window.innerWidth < 768) {
          var updatedSlides = wrapper.querySelectorAll('.swiper-slide');
          slideWidth = updatedSlides[0] ? updatedSlides[0].offsetWidth + 20 : 0;
          wrapper.style.scrollBehavior = 'auto';
          wrapper.scrollLeft = slideWidth * cloneCount;
        }
      }, 250);
    });
  }
  
  /**
   * Initialize all carousels
   */
  function init() {
    var carousels = document.querySelectorAll('.cards-carousel__carousel');
    
    for (var i = 0; i < carousels.length; i++) {
      initCardsCarousel(carousels[i]);
    }
  }
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();