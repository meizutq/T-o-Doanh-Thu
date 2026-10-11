import { VIETCOMBANK_LOGO_BASE64 } from '../assets/vietcombankLogo';

let cachedLogoImage: HTMLImageElement | null = null;

export function getVietcombankLogoImage(): HTMLImageElement {
  if (typeof window === 'undefined') {
    return new Image();
  }
  if (!cachedLogoImage) {
    cachedLogoImage = new Image();
    const custom = localStorage.getItem('unc_logo_custom');
    cachedLogoImage.src = custom || VIETCOMBANK_LOGO_BASE64;
  }
  return cachedLogoImage;
}

export function getCurrentLogoSrc(): string {
  if (typeof window === 'undefined') return VIETCOMBANK_LOGO_BASE64;
  return localStorage.getItem('unc_logo_custom') || VIETCOMBANK_LOGO_BASE64;
}

export function updateVietcombankLogo(newDataUrl: string | null) {
  if (typeof window === 'undefined') return;
  if (newDataUrl) {
    localStorage.setItem('unc_logo_custom', newDataUrl);
  } else {
    localStorage.removeItem('unc_logo_custom');
  }
  if (!cachedLogoImage) {
    cachedLogoImage = new Image();
  }
  cachedLogoImage.src = newDataUrl || VIETCOMBANK_LOGO_BASE64;
}

export function drawVietcombankHeaderLogo(
  ctx: CanvasRenderingContext2D,
  targetX = 75,
  targetY = 105,
  targetMaxW = 145,
  targetMaxH = 55
) {
  const img = getVietcombankLogoImage();
  if (img.complete && img.naturalWidth > 0) {
    const ratio = img.naturalWidth / img.naturalHeight;
    let w = targetMaxW;
    let h = w / ratio;
    if (h > targetMaxH) {
      h = targetMaxH;
      w = h * ratio;
    }
    const x = targetX;
    const y = targetY + (targetMaxH - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  } else {
    // Elegant fallback if decoding
    ctx.save();
    ctx.fillStyle = '#005a36';
    ctx.font = 'bold 22px "Times New Roman", Times, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Vietcombank', targetX, targetY + 35);
    ctx.restore();
  }
}
