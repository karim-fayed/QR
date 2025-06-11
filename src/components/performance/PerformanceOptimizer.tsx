'use client';

import { useEffect, useState } from 'react';
import { observePerformance, monitorMemoryUsage, registerServiceWorker, preloadResource } from '@/lib/performance';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

export function PerformanceMonitor({ children }: PerformanceMonitorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Initialize performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      observePerformance();
      
      // Monitor memory usage every 30 seconds
      const memoryInterval = setInterval(monitorMemoryUsage, 30000);
      
      return () => {
        clearInterval(memoryInterval);
      };
    }

    // Register service worker for caching in production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      // Preload critical resources
      preloadResource('/manifest.json', 'script');
      
      // Prefetch next likely pages after 2 seconds
      const prefetchTimer = setTimeout(() => {
        const prefetchPages = ['/pricing', '/verify-qr', '/dashboard'];
        prefetchPages.forEach(page => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = page;
          document.head.appendChild(link);
        });
      }, 2000);

      // Optimize images that are about to enter viewport
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );

      // Observe all images with data-src
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach((img) => imageObserver.observe(img));

      return () => {
        imageObserver.disconnect();
      };
    }
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Component for lazy loading images with performance optimization
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  priority = false 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : '');

  useEffect(() => {
    if (!priority) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    } else {
      setIsLoaded(true);
    }
  }, [src, priority]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse rounded-lg"
          style={{ width, height }}
        />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}

// Component for code splitting and lazy loading
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function LazyComponentWrapper({ 
  children, 
  fallback = <div className="h-32 bg-muted animate-pulse rounded-lg" />, 
  delay = 0 
}: LazyComponentWrapperProps) {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook for intersection observer optimization
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  threshold = 0.1,
  rootMargin = '0px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, rootMargin]);

  return isIntersecting;
}

// Component for performance-optimized video loading
interface OptimizedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export function OptimizedVideo({ 
  src, 
  poster, 
  className = '', 
  autoPlay = false, 
  muted = true, 
  loop = false 
}: OptimizedVideoProps) {
  const [shouldLoad, setShouldLoad] = useState(autoPlay);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
      }
    });
  };

  useEffect(() => {
    if (!autoPlay) {
      const observer = new IntersectionObserver(handleIntersection, {
        rootMargin: '100px',
      });

      const videoElement = document.querySelector(`video[data-src="${src}"]`);
      if (videoElement) {
        observer.observe(videoElement);
      }

      return () => observer.disconnect();
    }
  }, [src, autoPlay]);

  return (
    <video
      className={className}
      poster={poster}
      autoPlay={autoPlay && shouldLoad}
      muted={muted}
      loop={loop}
      playsInline
      data-src={src}
      preload={autoPlay ? 'auto' : 'none'}
    >
      {shouldLoad && <source src={src} type="video/mp4" />}
      متصفحك لا يدعم تشغيل الفيديو.
    </video>
  );
}

// Default export for dynamic imports
export default PerformanceMonitor;
