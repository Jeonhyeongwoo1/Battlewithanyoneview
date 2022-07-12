const crypto = require('crypto');

const aesKey = crypto.randomBytes(32) // 32 byte
const iv = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

/**
 * 
 * @param {String} text 
 */

module.exports = {
    aes256Encrypt: function (text) {
        let cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
        let result = cipher.update(text, 'utf8', 'base64');
        result += cipher.final('base64');
        return result
    },
    aes256Decrypt: function (text) {
        const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
        let result = decipher.update(cryptogram, 'base64', 'utf8');
        result += decipher.final('utf8');
        return result
    }
};