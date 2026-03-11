import CryptoJS from 'crypto-js';

export const createUuid = () => {
  const hex = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
  // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const y = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${y}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
