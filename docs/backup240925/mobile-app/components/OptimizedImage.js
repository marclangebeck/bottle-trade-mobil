import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';

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
    // Simuliere Lazy Loading - Bild wird erst geladen wenn Component gemountet wird
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (hasError) {
    return placeholder || <View style={[style, { backgroundColor: '#2c2c2c' }]} />;
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
        cache="force-cache"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        {...props}
      />
    </View>
  );
}

