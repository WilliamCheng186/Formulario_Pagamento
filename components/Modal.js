import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, title, children, zIndex, width, showCloseButton = true }) => {
    if (!isOpen) {
        return null;
    }

    const overlayStyle = {
        zIndex: zIndex || 1000,
    };

    const contentStyle = {
        width: width || 'auto',
        maxWidth: '90vw', // Para não ocupar a tela toda em telas pequenas
    };

    return (
        <div className={styles.modalOverlay} style={overlayStyle} onClick={onClose}>
            <div className={styles.modalContent} style={contentStyle} onClick={e => e.stopPropagation()}>
                {title && (
                    <div className={styles.modalHeader}>
                        <h2>{title}</h2>
                        {showCloseButton && (
                            <button onClick={onClose} className={styles.closeButton}>&times;</button>
                        )}
                    </div>
                )}
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal; 