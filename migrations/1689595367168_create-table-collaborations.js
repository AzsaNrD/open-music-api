exports.up = (pgm) => {
  pgm.createTable('collaborations', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      references: 'playlists(id)',
      referencesConstraintName: 'fk_collaborations.playlist_id_playlists.id',
      onDelete: 'CASCADE',
      unique: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      references: 'users(id)',
      referencesConstraintName: 'fk_collaborations.user_id_users.id',
      onDelete: 'CASCADE',
      unique: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('collaborations');
};
