// Column Carousel - True Infinite Slider (Fixed)
(function() {
  'use strict';

  /**
   * Initialize carousel with infinite scroll
   * @param {HTMLElement} carousel - The carousel container element
   */
  function initCarousel(carousel) {
    if (!carousel) return;
    
    var wrapper = carousel.querySelector('.swiper-wrapper');
    var originalSlides = carousel.querySelectorAll('.swiper-slide:not(.swiper-slide-clone)');
    
    if (!wrapper || originalSlides.length === 0) return;
    
    // Enhanced touch/swipe support for mobile only
    if (window.innerWidth < 768) {
      setupInfiniteScroll(wrapper, originalSlides);
    }
  }
  
  /**
   * Setup infinite scroll with smooth transitions
   * @param {HTMLElement} wrapper - The wrapper element
   * @param {NodeListOf<Element>} originalSlides - The original slide elements
   */
  function setupInfiniteScroll(wrapper, originalSlides) {
    // Remove any existing clones first
    var existingClones = wrapper.querySelectorAll('.swiper-slide-clone');
    existingClones.forEach(function(clone) {
      clone.remove();
    });
    
    var slideArray = Array.from(originalSlides);
    var cloneCount = slideArray.length;
    
    // Create clones - add before and after for true infinite
    var beforeFragment = document.createDocumentFragment();
    var afterFragment = document.createDocumentFragment();
    
    // Clone slides before (reversed for proper order)
    slideArray.forEach(function(slide) {
      var cloneBefore = slide.cloneNode(true);
      cloneBefore.classList.add('swiper-slide-clone');
      cloneBefore.setAttribute('aria-hidden', 'true');
      beforeFragment.appendChild(cloneBefore);
    });
    
    // Clone slides after
    slideArray.forEach(function(slide) {
      var cloneAfter = slide.cloneNode(true);
      cloneAfter.classList.add('swiper-slide-clone');
      cloneAfter.setAttribute('aria-hidden', 'true');
      afterFragment.appendChild(cloneAfter);
    });
    
    // Insert clones
    wrapper.insertBefore(beforeFragment, wrapper.firstChild);
    wrapper.appendChild(afterFragment);
    
    // Get slide width
    var allSlides = wrapper.querySelectorAll('.swiper-slide');
    var slideWidth = allSlides[0] ? allSlides[0].offsetWidth + 20 : 0;
    
    // Start at first original slide (after first set of clones)
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
     * Start dragging handler
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
     * While dragging handler
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
      
      // Check for infinite wrap while dragging
      checkInfiniteWrap();
    }
    
    /**
     * Stop dragging handler
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
     * Apply momentum scrolling
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
      
      // Scrolled past right clones - jump to original slides
      if (currentScroll >= totalWidth * 2) {
        isAdjusting = true;
        wrapper.style.scrollBehavior = 'auto';
        wrapper.scrollLeft = currentScroll - totalWidth;
        setTimeout(function() {
          isAdjusting = false;
        }, 50);
      }
      
      // Scrolled past left clones - jump to end of original slides
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
      
      // Check wrap after snap
      setTimeout(function() {
        checkInfiniteWrap();
      }, 350);
    }
    
    // Mouse events
    wrapper.addEventListener('mousedown', startDragging);
    wrapper.addEventListener('mousemove', whileDragging);
    wrapper.addEventListener('mouseup', stopDragging);
    wrapper.addEventListener('mouseleave', stopDragging);
    
    // Touch events
    wrapper.addEventListener('touchstart', startDragging, { passive: false });
    wrapper.addEventListener('touchmove', whileDragging, { passive: false });
    wrapper.addEventListener('touchend', stopDragging);
    
    // Prevent text selection
    wrapper.addEventListener('dragstart', function(e) {
      e.preventDefault();
    });
    
    // Scroll event listener
    var scrollTimeout = null;
    wrapper.addEventListener('scroll', function() {
      if (!isDown && !isAdjusting) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          checkInfiniteWrap();
        }, 100);
      }
    });
    
    // Handle window resize
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
   * Initialize all carousels on page
   */
  function init() {
    var carousels = document.querySelectorAll('.column-carousel__carousel');
    
    for (var i = 0; i < carousels.length; i++) {
      initCarousel(carousels[i]);
    }
  }
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();