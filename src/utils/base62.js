const characters =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const base = characters.length;

function encode(num) {
  let shortCode = '';

  while (num > 0) {
    shortCode = characters[num % base] + shortCode;
    num = Math.floor(num / base);
  }

  return shortCode || 'a';
}

module.exports = { encode };