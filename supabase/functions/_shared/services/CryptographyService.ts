import { Base64 } from "../utils/base64.ts";

export class CryptographyService {
  private encryptionPublicKey: CryptoKey | null = null;
  private encryptionPrivateKey: CryptoKey | null = null;
  private signingPublicKey: CryptoKey | null = null;
  private signingPrivateKey: CryptoKey | null = null;

  constructor(
    private readonly clientPublicKeyBase64: string
  ) {}

  /**
   * Initializes the service by importing the keys
   */
  public async initialize(): Promise<void> {
    try {
      const clientPublicKeyBytes = this.safeBase64Decode(
        this.clientPublicKeyBase64,
        'client public key'
      );
      
      // Import client's public key for encryption
      this.encryptionPublicKey = await crypto.subtle.importKey(
        'spki',
        clientPublicKeyBytes,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
      );

      // Import client's public key for verification
      this.signingPublicKey = await crypto.subtle.importKey(
        'spki',
        clientPublicKeyBytes,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
  
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize cryptography service: ${errorMessage}`);
    }
  }

  /**
   * Verifies a message signature using the client's public key
   */
  public async verifySignature(message: string, signatureBase64: string): Promise<boolean> {
    try {
      if (!this.signingPublicKey) throw new Error('Signing public key not initialized');
      const signatureBytes = this.safeBase64Decode(signatureBase64, 'signature');
      const messageBytes = new TextEncoder().encode(message);
      return await crypto.subtle.verify(
        { name: 'RSASSA-PKCS1-v1_5' },
        this.signingPublicKey,
        signatureBytes,
        messageBytes
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Signature verification failed: ${errorMessage}`);
    }
  }

  /**
   * Signs a message using the server's private key
   */
  public async sign(message: string): Promise<string> {
    try {
      if (!this.signingPrivateKey) throw new Error('Signing private key not initialized');
      const messageBytes = new TextEncoder().encode(message);
      const signature = await crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        this.signingPrivateKey,
        messageBytes
      );
      return Base64.encode(signature);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Message signing failed: ${errorMessage}`);
    }
  }

  /**
   * Encrypts a message using the client's public key
   */
  public async encrypt(message: string): Promise<string> {
    try {
      if (!this.encryptionPublicKey) throw new Error('Encryption public key not initialized');
      const messageBytes = new TextEncoder().encode(message);
      const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        this.encryptionPublicKey,
        messageBytes
      );
      return Base64.encode(encrypted);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Decrypts a message using the client's private key
   */
  public async decrypt(encryptedBase64: string): Promise<string> {
    try {
      if (!this.encryptionPrivateKey) throw new Error('Encryption private key not initialized');
      const encryptedBytes = this.safeBase64Decode(encryptedBase64, 'encrypted message');
      const decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        this.encryptionPrivateKey,
        encryptedBytes
      );
      return new TextDecoder().decode(decrypted);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Safely decodes base64 strings and performs validation
   */
  private safeBase64Decode(str: string, context: string): Uint8Array {
    try {
      const cleanStr = str.replace(/[\n\r\s]/g, '');
      
      if (cleanStr.includes('-----')) {
        throw new Error(`${context} contains PEM headers`);
      }

      const decoded = Base64.decode(cleanStr);
      const bytes = new Uint8Array(decoded);

      // Validate SPKI format for public keys
      if (context.includes('public key')) {
        if (bytes[0] !== 0x30 || bytes[1] !== 0x82) {
          throw new Error(
            `${context} is not in SPKI format. Expected [48, 130], got [${bytes[0]}, ${bytes[1]}]`
          );
        }
      }

      return bytes;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to decode base64 for ${context}: ${errorMessage}`);
    }
  }
} 