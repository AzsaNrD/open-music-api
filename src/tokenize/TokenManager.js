const Jwt = require('@hapi/jwt');
const config = require('../utils/config');
const InvariantError = require('../exception/InvariantError');

const TokenManager = {
  generateAccessToken: (payload) => Jwt.token.generate(payload, config.token.accessTokenKey),
  generateRefreshToken: (payload) => Jwt.token.generate(payload, config.token.refreshTokenKey),
  verifyRefreshToken: (refreshToken) => {
    try {
      const artifacts = Jwt.token.decode(refreshToken);

      Jwt.token.verifySignature(artifacts, config.token.refreshTokenKey);
      const { payload } = artifacts.decoded;

      return payload;
    } catch (error) {
      throw new InvariantError('Refresh token tidak valid');
    }
  },
};

module.exports = TokenManager;
