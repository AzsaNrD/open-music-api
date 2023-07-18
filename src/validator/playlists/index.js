const {
  PlaylistsPayloadSchema,
  PlaylistSongsPayloadSchema,
} = require('./schema');
const InvariantError = require('../../exception/InvariantError');

const PlaylistsValidator = {
  validatePlaylistsPayload: (payload) => {
    const validationResult = PlaylistsPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePlaylistSongsPayload: (payload) => {
    const validationResult = PlaylistSongsPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = PlaylistsValidator;
