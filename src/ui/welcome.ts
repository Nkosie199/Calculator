const STORAGE_KEY = 'calc:seenWelcome';

export function initWelcomeBanner(): void {
  const banner = document.getElementById('welcomeBanner') as HTMLDivElement;
  const dismissButton = document.getElementById('dismissWelcome') as HTMLButtonElement;

  let seen: boolean;
  try {
    seen = localStorage.getItem(STORAGE_KEY) === 'yes';
  } catch {
    seen = false;
  }

  if (!seen) banner.hidden = false;

  dismissButton.addEventListener('click', () => {
    banner.hidden = true;
    try {
      localStorage.setItem(STORAGE_KEY, 'yes');
    } catch {
      // ignore — the banner will just show again next visit
    }
  });
}
