const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistsPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist({ name, owner: credentialId });

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, credentialId);
    await this._service.deletePlaylist(id, credentialId);

    return {
      status: 'success',
      message: 'Berhasil menghapus playlist',
    };
  }

  async postPlaylistSongsHandler(request, h) {
    this._validator.validatePlaylistSongsPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, credentialId);
    await this._service.verifyPlaylistSong(songId);
    await this._service.addPlaylistSongs(id, songId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu ke dalam playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, credentialId);
    const playlist = await this._service.getPlaylistSongs(id);

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deletePlaylistSongsHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    const { songId } = request.payload;

    await this._service.verifyPlaylistAccess(id, credentialId);
    await this._service.deletePlaylistSongs(id, songId, credentialId);

    return {
      status: 'success',
      message: 'Berhasil menghapus lagu dalam playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(id, credentialId);
    const activities = await this._service.getPlaylistActivities(id);

    return {
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
