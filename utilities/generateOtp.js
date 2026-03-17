const crypto = require('crypto');

function generateRandomOTP(otpLength = 6) {
    const min = Math.pow(10, otpLength - 1); 
    const max = Math.pow(10, otpLength) - 1; 

    const otp = crypto.randomInt(min, max + 1); 

    return otp.toString(); 
}

module.exports = generateRandomOTP;