import React from 'react';
import styles from './KPICard.module.css'; // Usaremos um CSS module específico

const KPICard = ({ title, value, details, icon, cardColor }) => {
  const IconComponent = icon; // Permite passar o componente do ícone como prop

  return (
    <div className={`${styles.kpiCard} ${cardColor ? styles[cardColor] : ''}`}>
      <div className={styles.cardContent}>
        <div className={styles.value}>{value}</div>
        <div className={styles.title}>{title}</div>
        {details && <div className={styles.details}>{details}</div>}
      </div>
      {IconComponent && (
        <div className={styles.iconWrapper}>
          <IconComponent size={40} className={styles.icon} />
        </div>
      )}
    </div>
  );
};

export default KPICard; 