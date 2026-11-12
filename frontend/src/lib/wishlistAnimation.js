/**
 * Parabolic flight animation that shoots a glowing heart particle
 * from the clicked element straight into the navbar's wishlist button (#nav-wishlist-btn).
 */
export function flyHeartToNav(origin, onFinish) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (onFinish) onFinish();
    return;
  }

  const targetEl = document.getElementById('nav-wishlist-btn');
  if (!targetEl) {
    if (onFinish) onFinish();
    return;
  }

  // Determine starting coordinates
  let rect = null;
  if (origin instanceof HTMLElement) {
    rect = origin.getBoundingClientRect();
  } else if (origin?.currentTarget instanceof HTMLElement) {
    rect = origin.currentTarget.getBoundingClientRect();
  } else if (origin?.target instanceof HTMLElement) {
    rect = origin.target.getBoundingClientRect();
  } else if (origin?.getBoundingClientRect) {
    rect = origin.getBoundingClientRect();
  } else if (typeof origin?.clientX === 'number') {
    rect = {
      left: origin.clientX - 12,
      top: origin.clientY - 12,
      width: 24,
      height: 24,
    };
  }

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    if (onFinish) onFinish();
    return;
  }

  const targetRect = targetEl.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  const destX = targetRect.left + targetRect.width / 2;
  const destY = targetRect.top + targetRect.height / 2;

  // Create flying heart element
  const flyer = document.createElement('div');
  flyer.className = 'fixed pointer-events-none select-none';
  flyer.style.position = 'fixed';
  flyer.style.left = `${startX - 13}px`;
  flyer.style.top = `${startY - 13}px`;
  flyer.style.width = '26px';
  flyer.style.height = '26px';
  flyer.style.zIndex = '99999';
  flyer.style.display = 'flex';
  flyer.style.alignItems = 'center';
  flyer.style.justifyContent = 'center';
  flyer.style.willChange = 'transform, opacity';
  flyer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ff2e63" stroke="#ff2e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 3px 10px rgba(255, 46, 99, 0.75));">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  `;

  document.body.appendChild(flyer);

  const deltaX = destX - startX;
  const deltaY = destY - startY;

  // Parabolic upward arc curve
  const midY = deltaY * 0.4 - Math.min(110, Math.max(45, Math.abs(deltaY) * 0.22 + 35));

  const keyframes = [
    {
      transform: 'translate(0px, 0px) scale(0.85) rotate(0deg)',
      opacity: 0.9,
    },
    {
      offset: 0.35,
      transform: `translate(${deltaX * 0.3}px, ${midY}px) scale(1.35) rotate(-12deg)`,
      opacity: 1,
    },
    {
      offset: 0.7,
      transform: `translate(${deltaX * 0.72}px, ${deltaY * 0.65}px) scale(1.1) rotate(8deg)`,
      opacity: 0.95,
    },
    {
      offset: 0.9,
      transform: `translate(${deltaX * 0.92}px, ${deltaY * 0.9}px) scale(0.8) rotate(-4deg)`,
      opacity: 0.85,
    },
    {
      transform: `translate(${deltaX}px, ${deltaY}px) scale(0.4) rotate(0deg)`,
      opacity: 0.35,
    },
  ];

  let cleanedUp = false;
  const cleanUp = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (flyer.parentNode) {
      flyer.parentNode.removeChild(flyer);
    }
    if (onFinish) onFinish();
    window.dispatchEvent(new CustomEvent('wishlist-item-landed'));
  };

  // Safety fallback timer in case Web Animations API is interrupted
  const safetyTimeout = setTimeout(cleanUp, 900);

  if (typeof flyer.animate === 'function') {
    const animation = flyer.animate(keyframes, {
      duration: 650,
      easing: 'cubic-bezier(0.22, 0.88, 0.3, 1)',
      fill: 'forwards',
    });

    animation.onfinish = () => {
      clearTimeout(safetyTimeout);
      cleanUp();
    };

    animation.onerror = () => {
      clearTimeout(safetyTimeout);
      cleanUp();
    };
  } else {
    // Fallback for environments lacking element.animate
    cleanUp();
  }
}
