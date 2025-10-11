import { useEffect, useRef } from 'react';

/**
 * Track whether the component is still mounted.
 * Useful when async callbacks may resolve after unmount.
 */
export function useMountedRef(): React.MutableRefObject<boolean> {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

export default useMountedRef;
