const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');

class AlbumsService {
  constructor(songsService) {
    this._pool = new Pool();
    this._songsService = songsService;
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
}

module.exports = AlbumsService;
