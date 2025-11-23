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

  return (
    <View style={style}>
      {isLoading && (
        <View style={[style, { 
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
        style={[style, { opacity: isLoading ? 0 : 1 }]}
        resizeMode={resizeMode}
        fadeDuration={0}
        defaultSource={source} // Für lokale Assets - sofort anzeigen
        onLoad={() => {
          setIsLoading(false);
        }}
        onLoadStart={() => {
          // Für lokale Assets sollte onLoadStart sofort aufgerufen werden
          if (source && typeof source === 'object' && source.uri === undefined) {
            setIsLoading(false);
          }
        }}
        onError={(error) => {
          console.warn('⚠️ Fehler beim Laden des Bildes:', source?.uri || source);
          setHasError(true);
        }}
        {...props}
      />
    </View>
  );
}



