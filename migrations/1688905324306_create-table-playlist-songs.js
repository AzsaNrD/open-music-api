exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      references: 'playlists(id)',
      referencesConstraintName: 'fk_playlist_songs.playlist_id_playlists.id',
      onDelete: 'CASCADE',
    },
    song_id: {
      type: 'VARCHAR(50)',
      references: 'songs(id)',
      referencesConstraintName: 'fk_playlist_songs.song_id_songs.id',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_songs');
};
