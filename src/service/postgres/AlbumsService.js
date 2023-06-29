const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapSongsDBToModel } = require('../../utils/dataMapper');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const queryAlbumById = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const querySongByAlbumId = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM songs JOIN albums ON albums.id = songs."albumId" WHERE songs."albumId" = $1',
      values: [id],
    };

    const resultAlbumById = await this._pool.query(queryAlbumById);
    const resultSongByAlbumId = await this._pool.query(querySongByAlbumId);

    if (!resultAlbumById.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const albumData = resultAlbumById.rows[0];
    const songData = resultSongByAlbumId.rows;

    const album = {
      id: albumData.id,
      name: albumData.name,
      year: albumData.year,
      songs: songData.map(mapSongsDBToModel),
    };

    return album;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;
