import React, { useEffect, useState } from 'react';
import styles from './StatCounter.module.css';

let hasIncrementedThisPageLoad = false;

/**
 * @param {{
 *  label: string;
 * }} props
 */
const StatCounter = ({ label }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!hasIncrementedThisPageLoad) {
      hasIncrementedThisPageLoad = true;
      setCount(1);
    }
  }, []);

  return (
    <div className={styles.card} role="status" aria-live="polite" aria-label={`${label}: ${count}`}>
      <span className={styles.value}>{count}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default StatCounter;
