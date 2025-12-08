// OTP DAL removed — no-op stubs kept to avoid require-time errors

module.exports = {
  upsertOtp: async () => { return null; },
  findValidOtp: async () => { return null; },
  consumeOtp: async () => { return null; },
};
