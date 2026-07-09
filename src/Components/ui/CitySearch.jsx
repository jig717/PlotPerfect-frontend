import React, { useEffect, useId, useMemo, useState } from 'react';
import styles from './CitySearch.module.css';

/**
 * @param {{
 *  cities: string[];
 *  onSelect: (city: string) => void;
 * }} props
 */
const CitySearch = ({ cities, onSelect }) => {
  const inputId = useId();
  const listId = `${inputId}-listbox`;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const filteredCities = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();

    if (!normalized) {
      return cities;
    }

    return cities.filter((city) => city.toLowerCase().includes(normalized));
  }, [cities, debouncedQuery]);

  useEffect(() => {
    if (!filteredCities.length) {
      setActiveIndex(-1);
      return;
    }

    if (activeIndex >= filteredCities.length) {
      setActiveIndex(0);
    }
  }, [filteredCities, activeIndex]);

  const selectCity = (city) => {
    setQuery(city);
    setDebouncedQuery(city);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(city);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
    }

    if (!filteredCities.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCities.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? filteredCities.length - 1 : prev - 1));
    }

    if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault();
      selectCity(filteredCities[activeIndex]);
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const renderHighlightedCity = (city) => {
    const normalizedQuery = debouncedQuery.trim();

    if (!normalizedQuery) {
      return city;
    }

    const lowerCity = city.toLowerCase();
    const lowerQuery = normalizedQuery.toLowerCase();
    const matchStart = lowerCity.indexOf(lowerQuery);

    if (matchStart === -1) {
      return city;
    }

    const matchEnd = matchStart + normalizedQuery.length;

    return (
      <>
        {city.slice(0, matchStart)}
        <mark className={styles.highlight}>{city.slice(matchStart, matchEnd)}</mark>
        {city.slice(matchEnd)}
      </>
    );
  };

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={inputId}>
        Search city
      </label>

      <input
        id={inputId}
        type="text"
        value={query}
        className={styles.input}
        placeholder="Type a city name"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
            setActiveIndex(-1);
          }, 120);
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
      />

      {isOpen && (
        <ul id={listId} role="listbox" className={styles.list} aria-label="Matching cities">
          {filteredCities.length ? (
            filteredCities.map((city, index) => (
              <li
                key={city}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.option} ${index === activeIndex ? styles.activeOption : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCity(city)}
              >
                {renderHighlightedCity(city)}
              </li>
            ))
          ) : (
            <li className={styles.emptyState} aria-live="polite">
              No matching cities
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CitySearch;
