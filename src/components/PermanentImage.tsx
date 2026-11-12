import React, { useState, useEffect } from 'react';
import { getMediaFromVault, saveMediaToVault, extractFileName } from '../utils/idbStorage';
import { loadFileFromCloudFirestore } from '../firebase';
import { User, ImageOff, Loader2 } from 'lucide-react';

interface PermanentImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackSrc?: string;
  fallbackIcon?: 'user' | 'generic';
  fallbackClassName?: string;
}

export const PermanentImage: React.FC<PermanentImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  fallbackIcon = 'user',
  fallbackClassName = '',
  ...restProps
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const effective = src || fallbackSrc;
    setCurrentSrc(effective);
    setHasError(false);

    // If src is provided and not base64, check if we should eagerly load from IndexedDB Vault
    if (src && !src.startsWith('data:')) {
      getMediaFromVault(src).then((cached) => {
        if (cached) {
          setCurrentSrc(cached);
        }
      }).catch(() => {});
    }
  }, [src, fallbackSrc]);

  const handleError = async () => {
    if (!src || hasError || isResolving) {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        return;
      }
      setHasError(true);
      return;
    }

    setIsResolving(true);
    const fileName = extractFileName(src);

    try {
      // 1. Try retrieving from IndexedDB Vault
      const vaultData = await getMediaFromVault(src);
      if (vaultData) {
        setCurrentSrc(vaultData);
        setHasError(false);
        setIsResolving(false);
        return;
      }

      // 2. Try fetching from Server file download API
      if (fileName) {
        const response = await fetch(`/api/files/download/${encodeURIComponent(fileName)}`);
        if (response.ok) {
          const json = await response.json();
          if (json.status === 'ok' && json.dataUrl) {
            setCurrentSrc(json.dataUrl);
            setHasError(false);
            // Save to IndexedDB so it's cached permanently
            saveMediaToVault(src, json.dataUrl, {
              filename: fileName,
              type: json.type,
              size: json.size
            }).catch(() => {});
            setIsResolving(false);
            return;
          }
        }
      }

      // 3. Try recovering directly from Cloud Firestore
      const cloudDataUrl = await loadFileFromCloudFirestore(src);
      if (cloudDataUrl) {
        setCurrentSrc(cloudDataUrl);
        setHasError(false);
        saveMediaToVault(src, cloudDataUrl, { filename: fileName || 'recovered_file' }).catch(() => {});
        setIsResolving(false);
        return;
      }

      // 4. Try fallbackSrc if provided
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setIsResolving(false);
        return;
      }

      // 5. Neither source succeeded
      setHasError(true);
    } catch {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } finally {
      setIsResolving(false);
    }
  };

  if ((!currentSrc && !fallbackSrc) || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-emerald-100 text-emerald-800 ${className} ${fallbackClassName}`}
        title={alt}
      >
        {fallbackIcon === 'user' ? (
          <User className="w-1/2 h-1/2 text-emerald-700" />
        ) : (
          <ImageOff className="w-1/2 h-1/2 text-emerald-500" />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block overflow-hidden">
      {isResolving && (
        <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-xs flex items-center justify-center z-10">
          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
        </div>
      )}
      <img
        {...restProps}
        src={currentSrc}
        alt={alt}
        className={className}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};
