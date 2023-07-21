const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const AuthorizationError = require('../../exception/AuthorizationError');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');

class PlaylistsService {
  constructor(collaborationsService, songsService) {
    this._pool = new Pool();
    this._collaborationService = collaborationsService;
    this._songsService = songsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
        SELECT p.id, p.name, u.username
        FROM playlists AS p
        LEFT JOIN users AS u ON u.id = p.owner
        LEFT JOIN collaborations AS c ON c.playlist_id = p.id
        WHERE c.user_id = $1 OR p.owner = $1
      `,
      values: [owner],
    };
    const { rows } = await this._pool.query(query);

    return rows;
  }

  async deletePlaylist(playlistId, owner) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 AND owner = $2 RETURNING id',
      values: [playlistId, owner],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal menghapus playlists. Id tidak ditemukan');
    }
  }

  async addPlaylistSongs(playlistId, songId, userId) {
    const id = `playlist-songs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3)',
      values: [id, playlistId, songId],
    };

    await this._pool.query(query);
    this.addPlaylistActivities(playlistId, songId, userId, 'add');
  }

  async getPlaylistSongs(playlistId) {
    const queryPlaylist = {
      text: `
        SELECT p.id, p.name, u.username 
        FROM playlist_songs AS ps
        JOIN playlists AS p ON p.id = ps.playlist_id
        JOIN users AS u ON u.id = p.owner 
        WHERE p.id = $1
      `,
      values: [playlistId],
    };

    const playlist = await this._pool.query(queryPlaylist);
    const songs = await this._songsService.getMultipleSongByPlaylistId(playlistId);

    if (!playlist.rowCount) {
      throw new NotFoundError('Gagal mendapatkan playlist. Id tidak ditemukan');
    }

    return {
      ...playlist.rows[0],
      songs,
    };
  }

  async deletePlaylistSongs(playlistId, songId, credentialId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Gagal menghapus lagu dalam playlist. Id tidak ditemukan');
    }

    this.addPlaylistActivities(playlistId, songId, credentialId, 'delete');
  }

  async addPlaylistActivities(playlistId, songId, userId, action) {
    const id = `playlist-song-activities-${nanoid(16)}`;
    const timeNow = new Date().toISOString();

    const query = {
      text: `
        INSERT INTO playlist_song_activities
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      values: [id, playlistId, songId, userId, action, timeNow],
    };

    await this._pool.query(query);
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `
        SELECT u.username, s.title, psa.action, psa.time 
        FROM playlist_song_activities AS psa
        JOIN playlists AS p ON p.id = psa.playlist_id
        JOIN songs AS s ON s.id = psa.song_id
        JOIN users AS u ON u.id = p.owner
        WHERE p.id = $1
      `,
      values: [playlistId],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Gagal mendapatkan aktivitas playlist. Id tidak ditemukan');
    }

    return rows;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistSong(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal menambahkan lagu ke playlist. Lagu tidak ditemukan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
