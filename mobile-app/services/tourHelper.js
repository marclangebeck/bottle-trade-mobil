/**
 * Tour Helper Service
 * 
 * Hilfsfunktionen für den digitalen Rundgang
 */

/**
 * Misst die Position eines Elements im Fenster
 * 
 * @param {React.RefObject} ref - Ref zum Element
 * @returns {Promise<{x: number, y: number, width: number, height: number}>}
 */
export const measureElement = (ref) => {
  return new Promise((resolve, reject) => {
    if (!ref || !ref.current) {
      reject(new Error('Ref oder ref.current ist nicht verfügbar'));
      return;
    }

    // Versuche measureInWindow (funktioniert am besten)
    if (ref.current.measureInWindow) {
      ref.current.measureInWindow((x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    } 
    // Fallback: measure (relativ zum Parent)
    else if (ref.current.measure) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        resolve({ x: pageX, y: pageY, width, height });
      });
    }
    // Fallback: onLayout (wenn bereits gerendert)
    else {
      reject(new Error('Element kann nicht gemessen werden - keine measure-Methode verfügbar'));
    }
  });
};

/**
 * Misst mehrere Elemente gleichzeitig
 * 
 * @param {Object} refs - Objekt mit { elementId: ref }
 * @returns {Promise<Object>} - Objekt mit { elementId: { x, y, width, height } }
 */
export const measureElements = async (refs) => {
  const positions = {};
  const promises = [];

  for (const [elementId, ref] of Object.entries(refs)) {
    promises.push(
      measureElement(ref)
        .then(position => {
          positions[elementId] = position;
        })
        .catch(error => {
          console.warn(`⚠️ Tour: Element ${elementId} konnte nicht gemessen werden:`, error);
          // Setze Standard-Position, damit Tour nicht abbricht
          positions[elementId] = { x: 0, y: 0, width: 100, height: 100 };
        })
    );
  }

  await Promise.all(promises);
  return positions;
};

/**
 * Wartet, bis ein Element gerendert ist und misst es dann
 * 
 * @param {React.RefObject} ref - Ref zum Element
 * @param {number} maxWait - Maximale Wartezeit in ms (Standard: 2000)
 * @returns {Promise<{x: number, y: number, width: number, height: number}>}
 */
export const measureElementWhenReady = (ref, maxWait = 2000) => {
  return new Promise((resolve, reject) => {
    if (!ref || !ref.current) {
      // Warte kurz und versuche es erneut
      let attempts = 0;
      const maxAttempts = maxWait / 100;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (ref && ref.current) {
          clearInterval(checkInterval);
          measureElement(ref).then(resolve).catch(reject);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error(`Element nicht nach ${maxWait}ms gefunden`));
        }
      }, 100);
    } else {
      // Element ist bereits verfügbar, messe sofort
      measureElement(ref).then(resolve).catch(reject);
    }
  });
};






