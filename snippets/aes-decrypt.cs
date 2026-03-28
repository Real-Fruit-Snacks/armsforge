// @desc AES-256 decryption routine for encrypted payloads
/*
 * AES Decryption Snippet
 * ======================
 * Purpose: Decrypt AES-256 encrypted payloads at runtime
 * Mode:    CBC with PKCS7 padding
 * Usage:   Embed in loaders, implants, or stagers
 */

using System;
using System.Security.Cryptography;

public static class AESDecryption
{
    /// <summary>
    /// Decrypt AES-256 CBC encrypted data
    /// </summary>
    /// <param name="encryptedData">Encrypted byte array</param>
    /// <param name="key">256-bit (32 byte) encryption key</param>
    /// <param name="iv">128-bit (16 byte) initialization vector</param>
    /// <returns>Decrypted byte array</returns>
    public static byte[] DecryptAES256(byte[] encryptedData, byte[] key, byte[] iv)
    {
        // Validate inputs
        if (key.Length != 32) throw new ArgumentException("Key must be 256 bits (32 bytes)");
        if (iv.Length != 16) throw new ArgumentException("IV must be 128 bits (16 bytes)");

        using (Aes aes = Aes.Create())
        {
            aes.Key = key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using (ICryptoTransform decryptor = aes.CreateDecryptor())
            {
                return decryptor.TransformFinalBlock(encryptedData, 0, encryptedData.Length);
            }
        }
    }

    /// <summary>
    /// Decrypt with key and IV embedded in the encrypted data
    /// Format: [32-byte key][16-byte IV][encrypted payload]
    /// </summary>
    /// <param name="encryptedBlob">Complete encrypted blob</param>
    /// <returns>Decrypted payload</returns>
    public static byte[] DecryptEmbedded(byte[] encryptedBlob)
    {
        if (encryptedBlob.Length < 48) // 32 + 16 minimum
            throw new ArgumentException("Invalid encrypted blob length");

        byte[] key = new byte[32];
        byte[] iv = new byte[16];
        byte[] encrypted = new byte[encryptedBlob.Length - 48];

        Array.Copy(encryptedBlob, 0, key, 0, 32);        // Extract key
        Array.Copy(encryptedBlob, 32, iv, 0, 16);        // Extract IV
        Array.Copy(encryptedBlob, 48, encrypted, 0, encrypted.Length); // Extract payload

        byte[] result = DecryptAES256(encrypted, key, iv);

        // Clear sensitive data from memory
        Array.Clear(key, 0, key.Length);
        Array.Clear(iv, 0, iv.Length);

        return result;
    }

    /// <summary>
    /// Decrypt Base64-encoded encrypted data
    /// </summary>
    /// <param name="base64Encrypted">Base64 string containing encrypted data</param>
    /// <param name="base64Key">Base64 string containing 256-bit key</param>
    /// <param name="base64IV">Base64 string containing 128-bit IV</param>
    /// <returns>Decrypted byte array</returns>
    public static byte[] DecryptFromBase64(string base64Encrypted, string base64Key, string base64IV)
    {
        byte[] encrypted = Convert.FromBase64String(base64Encrypted);
        byte[] key = Convert.FromBase64String(base64Key);
        byte[] iv = Convert.FromBase64String(base64IV);

        return DecryptAES256(encrypted, key, iv);
    }

    /// <summary>
    /// Generate random 256-bit key
    /// </summary>
    /// <returns>32-byte random key</returns>
    public static byte[] GenerateKey()
    {
        using (var rng = RandomNumberGenerator.Create())
        {
            byte[] key = new byte[32];
            rng.GetBytes(key);
            return key;
        }
    }

    /// <summary>
    /// Generate random 128-bit IV
    /// </summary>
    /// <returns>16-byte random IV</returns>
    public static byte[] GenerateIV()
    {
        using (var rng = RandomNumberGenerator.Create())
        {
            byte[] iv = new byte[16];
            rng.GetBytes(iv);
            return iv;
        }
    }
}

// Example Usage:
/*
// Decrypt with separate key/IV
byte[] key = { ... }; // 32 bytes
byte[] iv = { ... };  // 16 bytes
byte[] encrypted = { ... };
byte[] plaintext = AESDecryption.DecryptAES256(encrypted, key, iv);

// Decrypt with embedded key/IV
byte[] blob = { ... }; // key + iv + encrypted payload
byte[] plaintext = AESDecryption.DecryptEmbedded(blob);

// Decrypt from Base64
string b64Encrypted = "...";
string b64Key = "...";
string b64IV = "...";
byte[] plaintext = AESDecryption.DecryptFromBase64(b64Encrypted, b64Key, b64IV);
*/