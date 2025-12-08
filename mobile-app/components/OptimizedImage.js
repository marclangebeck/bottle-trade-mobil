import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, Text } from 'react-native';

export default function OptimizedImage({ 
  source, 
  style, 
  resizeMode = 'cover',
  placeholder = null,
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);

  useEffect(() => {
    // Für lokale Assets (require) - sofort laden, kein Delay
    if (source && typeof source === 'object' && source.uri === undefined) {
      // Lokales Asset - bereits geladen durch Preload
      setIsLoading(false);
    }
    
    // Prüfe ob es eine lokale URI ist (file://, content://, ph://)
    // Diese können möglicherweise nicht mehr verfügbar sein, besonders auf anderen Geräten
    if (source && typeof source === 'object' && source.uri) {
      const uri = source.uri;
      if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://')) {
        // Lokale URI - wird wahrscheinlich auf anderen Geräten fehlschlagen
        console.warn('⚠️ Lokale URI erkannt (funktioniert nur auf dem ursprünglichen Gerät):', uri.substring(0, 50) + '...');
        // Setze einen Timeout, um zu prüfen, ob das Bild geladen werden kann
        const timeout = setTimeout(() => {
          if (isLoading) {
            console.warn('⚠️ Lokale URI konnte nicht geladen werden (wahrscheinlich nicht verfügbar auf diesem Gerät)');
            setHasError(true);
          }
        }, 3000); // 3 Sekunden Timeout für lokale URIs
        
        return () => clearTimeout(timeout);
      }
    }
  }, [source, isLoading]);

  if (hasError) {
    // Bei Fehler: Zeige Placeholder oder leeren View
    // Prüfe ob es eine lokale URI war, die fehlgeschlagen ist
    const isLocalUri = source && typeof source === 'object' && source.uri && 
      (source.uri.startsWith('file://') || source.uri.startsWith('content://') || source.uri.startsWith('ph://'));
    
    return placeholder || (
      <View style={[style, { 
        backgroundColor: 'rgba(44, 44, 44, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8
      }]}>
        {isLocalUri ? (
          <>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>🍷</Text>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 12, 
              opacity: 0.7,
              textAlign: 'center',
              paddingHorizontal: 8
            }}>
              Bild nicht verfügbar{'\n'}(lokale Datei)
            </Text>
          </>
        ) : (
          <Image
            source={require('../assets/images/Logo_white.png')}
            style={{ width: 40, height: 40, opacity: 0.3 }}
            resizeMode="contain"
          />
        )}
      </View>
    );
  }

  // Extrahiere Zentrierungs-Eigenschaften vom Style
  const styleObj = Array.isArray(style) ? Object.assign({}, ...style.filter(s => s)) : (style || {});
  const { justifyContent, alignItems, width, height, backgroundColor, ...imageStyleProps } = styleObj;
  
  // Container-Style: Feste Dimensionen, zentriert
  // WICHTIG: backgroundColor wird NICHT übernommen, da der Container transparent sein soll
  const containerStyle = {
    width: width || '100%',
    height: height || 250,
    justifyContent: 'center',  // Immer zentrieren
    alignItems: 'center',       // Immer zentrieren
    backgroundColor: 'transparent', // Immer transparent, damit Bilder sichtbar sind
  };
  
  // Image-Style: Bei "contain" sollte das Image die Container-Dimensionen haben
  // resizeMode="contain" sorgt dafür, dass der Bildinhalt zentriert ist
  // WICHTIG: resizeMode="contain" zentriert den Bildinhalt automatisch,
  // aber das Image-Element selbst muss die Container-Dimensionen haben
  const imageStyle = resizeMode === 'contain' ? {
    width: width || '100%',
    height: height || 250,
    opacity: isLoading ? 0 : 1,
  } : {
    ...imageStyleProps,
    width: width || '100%',
    height: height || 250,
    opacity: isLoading ? 0 : 1,
  };

  return (
    <View style={containerStyle}>
      {isLoading && (
        <View style={[containerStyle, { 
          position: 'absolute', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#2c2c2c',
          zIndex: 1
        }]}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
      <Image
        source={source}
        style={imageStyle}
        resizeMode={resizeMode}
        fadeDuration={0}
        defaultSource={source} // Für lokale Assets - sofort anzeigen
        onLoad={(event) => {
          setIsLoading(false);
          console.log('✅ Bild erfolgreich geladen:', source?.uri?.substring(0, 50) || 'lokales Asset');
          // Optional: Bilddimensionen speichern für zukünftige Verwendung
          if (event.nativeEvent?.source?.width && event.nativeEvent?.source?.height) {
            setImageDimensions({
              width: event.nativeEvent.source.width,
              height: event.nativeEvent.source.height,
            });
            console.log('📐 Bild-Dimensionen:', event.nativeEvent.source.width, 'x', event.nativeEvent.source.height);
          }
        }}
        onLoadStart={() => {
          console.log('🔄 Bild-Loading gestartet:', source?.uri?.substring(0, 50) || 'lokales Asset');
          // Für lokale Assets sollte onLoadStart sofort aufgerufen werden
          if (source && typeof source === 'object' && source.uri === undefined) {
            setIsLoading(false);
          }
        }}
        onError={(error) => {
          console.warn('⚠️ Fehler beim Laden des Bildes:', source?.uri || source);
          console.warn('⚠️ Fehler-Details:', error);
          setHasError(true);
        }}
        {...props}
      />
    </View>
  );
}



