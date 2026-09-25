import React, { useEffect, useRef, useState, useCallback } from 'react';

export function useScrollReveal(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const timeoutRef = useRef(null);

  const setRef = useCallback((node) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // No IntersectionObserver (old browser / SSR): reveal immediately,
    // content must never get stuck invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
              setIsVisible(true);
            }, delay);
          } else {
            setIsVisible(true);
          }
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return [setRef, isVisible];
}

export function useStaggeredReveal(itemCount, options = {}) {
  const {
    baseDelay = 80,
    ...revealOptions
  } = options;

  const refs = useRef([]);
  const [visibleItems, setVisibleItems] = useState(new Set());

  const setItemRef = useCallback((index) => (node) => {
    refs.current[index] = node;
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisibleItems(new Set(refs.current.map((_, i) => i)));
      return;
    }
    const observers = refs.current.map((element, index) => {
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems(prev => new Set([...prev, index]));
            }, index * baseDelay);
            observer.unobserve(element);
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach(obs => obs?.disconnect());
    };
  }, [baseDelay]);

  return [setItemRef, visibleItems];
}

export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  as: Component = 'div',
  triggerOnce = true,
  ...props
}) {
  const [ref, isVisible] = useScrollReveal({ delay, triggerOnce });

  return (
    <Component
      ref={ref}
      className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggeredReveal({
  children,
  baseDelay = 80,
  className = '',
  as: Component = 'div',
  ...props
}) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const [setItemRef, visibleItems] = useStaggeredReveal(childArray.length, { baseDelay });

  return (
    <Component className={`staggered-reveal ${className}`} {...props}>
      {childArray.map((child, index) => (
        <div
          key={index}
          ref={setItemRef(index)}
          className={`stagger-item ${visibleItems.has(index) ? 'is-visible' : ''}`}
          style={{ '--index': index }}
        >
          {child}
        </div>
      ))}
    </Component>
  );
}

export function ScrollRevealImage({
  src,
  alt,
  className = '',
  delay = 0,
  placeholder = 'blur',
  ...props
}) {
  const [ref, isVisible] = useScrollReveal({ delay });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`scroll-reveal-image ${isVisible ? 'is-visible' : ''} ${className}`} ref={ref}>
      {!loaded && !error && placeholder === 'blur' && (
        <div className="image-placeholder" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`reveal-image ${loaded ? 'loaded' : ''} ${error ? 'error' : ''}`}
        {...props}
      />
    </div>
  );
}