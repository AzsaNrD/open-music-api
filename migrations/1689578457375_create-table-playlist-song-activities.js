exports.up = (pgm) => {
  pgm.createTable('playlist_song_activities', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      references: 'playlists(id)',
      referencesConstraintName: 'fk_playlist_song_activities.playlist_id_playlists.id',
      onDelete: 'CASCADE',
    },
    song_id: {
      type: 'TEXT',
      notNull: true,
    },
    user_id: {
      type: 'TEXT',
      notNull: true,
    },
    action: {
      type: 'TEXT',
      notNull: true,
    },
    time: {
      type: 'TIMESTAMPTZ',
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_song_activites');
};
