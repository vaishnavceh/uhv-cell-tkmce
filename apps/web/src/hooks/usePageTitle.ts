import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | UHV Cell - TKM College of Engineering`;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
