const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');

class AlbumsService {
  constructor(songsService, cacheService) {
    this._pool = new Pool();
    this._songsService = songsService;
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return rows[0].id;
  }

  async addCoverUrlByAlbumId(id, url) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
      values: [url, id],
    };

    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal menambahkan coverUrl. Id album tidak ditemukan');
    }
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const album = await this._pool.query(query);
    const songs = await this._songsService.getMultipleSongByAlbumId(id);

    if (!album.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return {
      ...album.rows[0],
      songs,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addUserAlbumLikes(userId, albumId) {
    const id = `user-album-likes-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw InvariantError('Gagal menyukai album. Terjadi kesalahan saat menambahkan like');
    }

    await this._cacheService.delete(`albumLikes:${albumId}`);
  }

  async deleteUserAlbumLikes(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError(
        'Gagal batal menyukai album. Album tidak ditemukan atau Anda belum menyukai album ini sebelumnya',
      );
    }

    await this._cacheService.delete(`albumLikes:${albumId}`);
  }

  async getUserAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`albumLikes:${albumId}`);
      return [JSON.parse(result), true];
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const { rowCount } = await this._pool.query(query);

      if (!rowCount) {
        throw NotFoundError('Gagal mendapatkan jumlah album like. Album tidak ditemukan');
      }

      await this._cacheService.set(`albumLikes:${albumId}`, JSON.stringify(rowCount));

      return [rowCount, false];
    }
  }

  async verifyAlbumExist(id) {
    const query = {
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async verifyUserAlbumLikes(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const { rowCount } = await this._pool.query(query);

    if (rowCount) {
      throw new InvariantError('Gagal menyukai album. Kamu sudah menyukai album ini sebelumnya');
    }
  }
}

module.exports = AlbumsService;
