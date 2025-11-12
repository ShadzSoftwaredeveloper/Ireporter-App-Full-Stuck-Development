// Simple in-memory OTP storage
const otpStore = new Map();

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOtp = (email, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });
  setTimeout(() => otpStore.delete(email), 10 * 60 * 1000);
};

export const verifyOtp = (email, otp) => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { isValid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { isValid: false, message: 'OTP has expired' };
  }
  
  if (stored.otp !== otp) {
    return { isValid: false, message: 'Invalid OTP' };
  }
  
  otpStore.delete(email);
  return { isValid: true, message: 'OTP verified successfully' };
};

export const hasOtp = (email) => {
  return otpStore.has(email);
};