import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, CaretDown } from '@phosphor-icons/react';

export function Accordion({ items, className = '', allowMultiple = false, bordered = true }) {
  const [openItems, setOpenItems] = useState(
    items
      .filter(item => item.defaultOpen)
      .map(item => item.id)
  );

  const toggleItem = (id) => {
    setOpenItems(prev => {
      if (allowMultiple) {
        if (prev.includes(id)) {
          return prev.filter(itemId => itemId !== id);
        }
        return [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  };

  return (
    <div className={`accordion ${className}`} role="region" aria-label="Accordion">
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          index={index}
          isOpen={openItems.includes(item.id)}
          onToggle={toggleItem}
          bordered={bordered}
          last={index === items.length - 1}
        />
      ))}
    </div>
  );
}

function AccordionItem({ item, index, isOpen, onToggle, bordered, last }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className="accordion-item" style={{ borderBottom: bordered && !last ? '1px solid var(--color-border)' : 'none' }}>
      <button
        className="accordion-trigger"
        onClick={() => onToggle(item.id)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${item.id}`}
        id={`accordion-trigger-${item.id}`}
      >
        <span className="accordion-title">{item.title}</span>
        {item.description && <span className="accordion-description">{item.description}</span>}
        <span className="accordion-icon" aria-hidden="true">
          {isOpen ? <Minus weight="bold" size={20} /> : <Plus weight="bold" size={20} />}
        </span>
      </button>
      <div
        id={`accordion-content-${item.id}`}
        role="region"
        aria-labelledby={`accordion-trigger-${item.id}`}
        className="accordion-content"
        style={{
          maxHeight: height,
          overflow: 'hidden',
          transition: 'max-height 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div ref={contentRef} className="accordion-content-inner">
          {item.content}
        </div>
      </div>
    </div>
  );
}

export function AccordionSimple({ items, className = '' }) {
  return (
    <div className={`accordion accordion-simple ${className}`}>
      {items.map((item, index) => (
        <AccordionSimpleItem key={item.id} item={item} index={index} last={index === items.length - 1} />
      ))}
    </div>
  );
}

function AccordionSimpleItem({ item, index, last }) {
  const [isOpen, setIsOpen] = useState(item.defaultOpen || false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className="accordion-item"
      style={{
        borderBottom: !last ? '1px solid var(--color-border)' : 'none',
      }}
    >
      <button
        className="accordion-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`accordion-simple-content-${item.id}`}
        id={`accordion-simple-trigger-${item.id}`}
      >
        <span className="accordion-title">{item.title}</span>
        <span className="accordion-icon" aria-hidden="true">
          {isOpen ? <Minus weight="bold" size={20} /> : <Plus weight="bold" size={20} />}
        </span>
      </button>
      <div
        id={`accordion-simple-content-${item.id}`}
        role="region"
        aria-labelledby={`accordion-simple-trigger-${item.id}`}
        className="accordion-content"
        style={{
          maxHeight: height,
          overflow: 'hidden',
          transition: 'max-height 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div ref={contentRef} className="accordion-content-inner">
          {item.content}
        </div>
      </div>
    </div>
  );
}