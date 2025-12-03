// Hilfsfunktionen zur Bestimmung des Weintyps (Rot/Weiß)

/**
 * Liste bekannter Rotwein-Rebsorten
 */
const RED_WINE_GRAPES = [
  'pinot noir', 'spätburgunder', 'merlot', 'cabernet sauvignon', 'cabernet',
  'syrah', 'shiraz', 'tempranillo', 'sangiovese', 'nebbiolo', 'barbera',
  'zinfandel', 'malbec', 'grenache', 'gamay', 'dornfelder', 'portugieser',
  'trollinger', 'lemberger', 'blaufränkisch', 'zweigelt', 'st. laurent',
  'pinot meunier', 'schwarzriesling', 'müllerrebe', 'pinotage', 'cinsault',
  'carignan', 'mourvèdre', 'monastrell', 'bobal', 'graciano', 'mazuelo',
  'agiorgitiko', 'xinomavro', 'nero d\'avola', 'corvina', 'rondinella',
  'molinara', 'sagrantino', 'montepulciano', 'primitivo', 'negroamaro',
  'aglianico', 'tannat', 'carmenère', 'petit verdot', 'petite sirah',
  'dolcetto', 'freisa', 'bonarda', 'corvina veronese', 'refosco',
  'lagrein', 'schiava', 'teroldego', 'marzemino', 'cesanese',
  'cannonau', 'carignano', 'gaglioppo', 'magliocco', 'nerello mascalese',
  'nerello cappuccio', 'frappato', 'perricone', 'susumaniello', 'negroamaro',
  'primitivo di manduria', 'aglianico del vulture', 'tintilla de rota',
  'bobal', 'monastrell', 'mazuelo', 'graciano', 'cariñena', 'garnacha tinta',
  'tempranillo', 'tinta de toro', 'tinta roriz', 'touriga nacional',
  'touriga franca', 'tinta barroca', 'tinta cão', 'sousão', 'vinhão',
  'baga', 'castelão', 'trincadeira', 'alfrocheiro', 'periquita',
  'aragonez', 'alicante bouschet', 'tannat', 'cabernet franc',
  'petit verdot', 'carmenère', 'malbec', 'tannat', 'pinotage'
];

/**
 * Liste bekannter Weißwein-Rebsorten
 */
const WHITE_WINE_GRAPES = [
  'riesling', 'chardonnay', 'sauvignon blanc', 'pinot gris', 'pinot grigio',
  'gewürztraminer', 'müller-thurgau', 'silvaner', 'sylvaner', 'kerner',
  'scheurebe', 'bacchus', 'ortega', 'huxelrebe', 'morio-muskat',
  'elbling', 'gutedel', 'chasselas', 'furmint', 'welschriesling',
  'grüner veltliner', 'neuburger', 'rotgipfler', 'zierfandler', 'muskateller',
  'muscat', 'moscato', 'moscatel', 'albarino', 'albariño', 'verdejo',
  'godello', 'loureiro', 'treixadura', 'caiño blanco', 'torrontés',
  'viognier', 'marsanne', 'roussanne', 'grenache blanc', 'clairette',
  'bourboulenc', 'picpoul', 'vermentino', 'rolle', 'vermentino',
  'fiano', 'greco', 'falanghina', 'coda di volpe', 'carricante',
  'catarratto', 'inzolia', 'grillo', 'zibibbo', 'malvasia',
  'trebbiano', 'verdicchio', 'pecorino', 'grechetto', 'ortrugo',
  'garganega', 'soave', 'pinot bianco', 'pinot blanc', 'auxerrois',
  'chardonnay', 'sauvignon blanc', 'semillon', 'sémillon', 'chenin blanc',
  'colombard', 'ugni blanc', 'trebbiano', 'folle blanche', 'gros manseng',
  'petit manseng', 'courbu', 'arrufiac', 'baroque', 'sauvignon gris',
  'muscadelle', 'sémillon', 'sauvignon blanc', 'riesling', 'gewürztraminer',
  'pinot gris', 'pinot grigio', 'müller-thurgau', 'silvaner', 'kerner',
  'scheurebe', 'bacchus', 'ortega', 'huxelrebe', 'morio-muskat',
  'elbling', 'gutedel', 'chasselas', 'furmint', 'welschriesling',
  'grüner veltliner', 'neuburger', 'rotgipfler', 'zierfandler', 'muskateller'
];

/**
 * Bestimmt, ob ein Wein ein Rotwein ist
 * @param {Object} wine - Wein-Objekt
 * @returns {boolean} - true wenn Rotwein, false wenn Weißwein oder unbekannt
 */
export const isRedWine = (wine) => {
  if (!wine) return false;
  
  // Prüfe verschiedene Felder
  const grapeVariety = (wine.grapeVariety || wine.grape || wine.rebsorte || '').toLowerCase();
  const wineType = (wine.wineType || wine.type || '').toLowerCase();
  const name = (wine.name || '').toLowerCase();
  
  // Prüfe expliziten Weintyp
  if (wineType.includes('rot') || wineType.includes('red') || wineType.includes('rouge')) {
    return true;
  }
  if (wineType.includes('weiß') || wineType.includes('white') || wineType.includes('blanc') || wineType.includes('bianco')) {
    return false;
  }
  
  // Prüfe Rebsorte
  if (grapeVariety) {
    const isRedGrape = RED_WINE_GRAPES.some(redGrape => 
      grapeVariety.includes(redGrape) || redGrape.includes(grapeVariety)
    );
    if (isRedGrape) return true;
    
    const isWhiteGrape = WHITE_WINE_GRAPES.some(whiteGrape => 
      grapeVariety.includes(whiteGrape) || whiteGrape.includes(grapeVariety)
    );
    if (isWhiteGrape) return false;
  }
  
  // Prüfe Namen (Fallback)
  const redKeywords = ['rot', 'red', 'rouge', 'noir', 'nero', 'tinto', 'rosso'];
  const whiteKeywords = ['weiß', 'white', 'blanc', 'bianco', 'blanco', 'weiss'];
  
  if (redKeywords.some(keyword => name.includes(keyword))) {
    return true;
  }
  if (whiteKeywords.some(keyword => name.includes(keyword))) {
    return false;
  }
  
  // Standard: Wenn nicht eindeutig, als Rotwein annehmen (häufigster Fall)
  return true;
};

/**
 * Gibt die Pin-Farbe für einen Wein zurück
 * @param {Object} wine - Wein-Objekt
 * @returns {string} - '#FF0000' für Rotwein, '#FFD700' für Weißwein
 */
export const getWinePinColor = (wine) => {
  return isRedWine(wine) ? '#FF0000' : '#FFD700'; // Rot oder Gold (Gelb)
};














