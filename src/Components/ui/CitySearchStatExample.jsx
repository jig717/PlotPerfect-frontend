import React, { useState } from 'react';
import CitySearch from './CitySearch';
import StatCounter from './StatCounter';
import styles from './CitySearchStatExample.module.css';

const CITY_DATA = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
  'San Francisco',
  'Columbus',
  'Indianapolis',
];

const CitySearchStatExample = () => {
  const [selectedCity, setSelectedCity] = useState('None selected');

  return (
    <section className={styles.wrapper} aria-label="City Search and Stat Counter Example">
      <StatCounter label="Active Listings" />

      <CitySearch cities={CITY_DATA} onSelect={(city) => setSelectedCity(city)} />

      <p className={styles.selectedCity}>Selected city: {selectedCity}</p>
    </section>
  );
};

export default CitySearchStatExample;
