/**
 * Utility function to handle lazy loading of images
 */
export class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Check if IntersectionObserver is supported
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute("data-src");
              }
              this.observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: "50px 0px",
          threshold: 0.01,
        },
      );
    }
  }

  /**
   * Add lazy loading to an image element
   * @param {HTMLImageElement} img - The image element to lazy load
   * @param {string} src - The source URL of the image
   */
  addLazyLoading(img, src) {
    if (this.observer) {
      img.dataset.src = src;
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // Placeholder
      this.observer.observe(img);
    } else {
      img.src = src;
    }
  }

  /**
   * Add lazy loading to multiple image elements
   * @param {NodeList|Array} images - Collection of image elements
   */
  addLazyLoadingToImages(images) {
    images.forEach((img) => {
      if (img.dataset.src) {
        this.addLazyLoading(img, img.dataset.src);
      }
    });
  }

  /**
   * Test function to verify lazy loading is working
   * @returns {boolean} - Whether lazy loading is properly configured
   */
  testLazyLoading() {
    const testResults = {
      intersectionObserverSupported: "IntersectionObserver" in window,
      observerInitialized: this.observer !== null,
      imagesObserved: 0,
    };

    // Count how many images are being observed
    if (this.observer) {
      const observedImages = document.querySelectorAll("img[data-src]");
      testResults.imagesObserved = observedImages.length;
    }

    return (
      testResults.intersectionObserverSupported &&
      testResults.observerInitialized
    );
  }
}

// Create a singleton instance
export const lazyLoader = new LazyLoader();

// Add test function to window for easy access
window.testLazyLoading = () => lazyLoader.testLazyLoading();
