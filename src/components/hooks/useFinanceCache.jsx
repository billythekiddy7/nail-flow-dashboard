import { useState, useEffect, useRef } from 'react';

// Cache LRU in-memory para dados financeiros
class LRUCache {
  constructor(maxSize = 10, ttl = 45000) { // 45 segundos TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.timers = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Mover para o fim (mais recente)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key, value) {
    // Limpar timer anterior se existir
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Remover mais antigo se necessário
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      if (this.timers.has(firstKey)) {
        clearTimeout(this.timers.get(firstKey));
        this.timers.delete(firstKey);
      }
    }

    // Adicionar novo item
    this.cache.set(key, { value, timestamp: Date.now() });

    // Configurar timer de expiração
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, this.ttl);
    
    this.timers.set(key, timer);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }
}

// Hook para cache de dados financeiros
export const useFinanceCache = () => {
  const cacheRef = useRef(new LRUCache());

  useEffect(() => {
    // Cleanup no unmount
    return () => {
      cacheRef.current.clear();
    };
  }, []);

  const getCached = (key) => {
    return cacheRef.current.get(key);
  };

  const setCached = (key, value) => {
    cacheRef.current.set(key, value);
  };

  const generateKey = (dateRange, filters = {}) => {
    const dateKey = `${dateRange.start?.getTime()}_${dateRange.end?.getTime()}`;
    const filterKey = Object.keys(filters).length > 0 ? JSON.stringify(filters) : '';
    return `${dateKey}_${filterKey}`;
  };

  return { getCached, setCached, generateKey };
};