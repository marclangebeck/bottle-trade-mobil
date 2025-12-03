/**
 * Tour-Steps Definition für den digitalen Rundgang
 * 
 * Jeder Step definiert:
 * - id: Eindeutige ID des Steps
 * - screen: Auf welchem Screen dieser Step angezeigt wird
 * - target: ID des UI-Elements, das hervorgehoben werden soll
 * - title: Titel der Sprechblase
 * - text: Beschreibungstext
 * - bubblePosition: Position der Sprechblase relativ zum Element ('top', 'bottom', 'left', 'right')
 * - spotlightShape: Form des Spotlights ('circle' oder 'rectangle')
 * - spotlightPadding: Padding um das Element (optional)
 */

export const tourSteps = [
  {
    id: 'welcome',
    screen: 'dashboard',
    target: 'dashboard-header',
    title: 'Willkommen bei Bottle-Trade! 🍷',
    text: 'Dies ist dein Dashboard. Hier findest du eine Übersicht über deine Weine, die Weinbörse und wichtige Funktionen der App. Das Symbol "Hamburger Menü" führt dich zu spannenden weiteren Möglichkeiten.',
    bubblePosition: 'bottom',
    spotlightShape: 'rectangle',
    spotlightPadding: 8,
  },
  {
    id: 'weinboerse-button',
    screen: 'dashboard',
    target: 'bottom-nav-weinboerse',
    title: '🌐 Weinbörse',
    text: 'Hier findest du alle verfügbaren Weine zum Tauschen. Du kannst nach Region, Jahrgang oder Rebsorte suchen und filtern.',
    bubblePosition: 'top',
    spotlightShape: 'rectangle',
    spotlightPadding: 8,
  },
  {
    id: 'weinregal-button',
    screen: 'dashboard',
    target: 'bottom-nav-weinregal',
    title: '🍷 Mein Weinregal',
    text: 'In deinem Weinregal verwaltest du alle deine Weine. Du kannst sie in der Weinbörse veröffentlichen oder privat halten.',
    bubblePosition: 'top',
    spotlightShape: 'rectangle',
    spotlightPadding: 8,
  },
  // Hinweis: "Weinregal befüllen" ist nicht in BottomNavigation, daher entfernt
  // User kann über Hamburger-Menü oder Weinregal-Screen darauf zugreifen
  {
    id: 'karte',
    screen: 'dashboard',
    target: 'dashboard-map',
    title: '🗺️ Geokarte',
    text: 'Auf dieser Karte siehst du alle verfügbaren Weine in deiner Umgebung. Die Entfernung wird automatisch berechnet.',
    bubblePosition: 'top',
    spotlightShape: 'rectangle',
    spotlightPadding: 8,
  },
  {
    id: 'profil-wunschliste',
    screen: 'dashboard',
    target: 'dashboard-logo-header',
    title: '👤 Profil & Wunschliste',
    text: 'Hier findest du alle wichtigen Icons im Header: Das Hamburger-Menü führt zu weiteren Funktionen, das Herz-Icon zeigt deine Wunschliste an, und dein Profil-Icon (rechts oben) öffnet deine Profil-Einstellungen.',
    bubblePosition: 'bottom',
    spotlightShape: 'rectangle',
    spotlightPadding: 8,
  },
  {
    id: 'infobox',
    screen: 'dashboard',
    target: 'bottom-nav-infobox',
    title: '📰 InfoBox',
    text: 'In der InfoBox wirst du über neue Tauschanfragen benachrichtigt. Außerdem hast du hier, nach einem erfolgreichen Tausch, die Möglichkeit, Kontakt mit dem Tauschpartner aufzunehmen.',
    bubblePosition: 'top',
    spotlightShape: 'rectangle',
    spotlightPadding: 8,
  },
];

/**
 * Hilfsfunktion: Finde alle Steps für einen bestimmten Screen
 */
export const getTourStepsForScreen = (screenName) => {
  return tourSteps.filter(step => step.screen === screenName);
};

/**
 * Hilfsfunktion: Finde einen Step nach ID
 */
export const getTourStepById = (stepId) => {
  return tourSteps.find(step => step.id === stepId);
};

/**
 * Hilfsfunktion: Finde den nächsten Step
 */
export const getNextTourStep = (currentStepId) => {
  const currentIndex = tourSteps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex >= tourSteps.length - 1) {
    return null;
  }
  return tourSteps[currentIndex + 1];
};

/**
 * Hilfsfunktion: Finde den vorherigen Step
 */
export const getPreviousTourStep = (currentStepId) => {
  const currentIndex = tourSteps.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return tourSteps[currentIndex - 1];
};

