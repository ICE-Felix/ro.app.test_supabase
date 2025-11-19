export class Base64 {
  static encode(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  static decode(base64: string): Uint8Array {
    const binary = atob(base64);
    return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)));
  }
} 