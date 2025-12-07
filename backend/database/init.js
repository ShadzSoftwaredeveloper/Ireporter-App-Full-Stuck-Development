const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const conn = await pool.getConnection();
  try {
    // Split by semicolon while ignoring inside strings is complex; schema has one statement per line ending with ;
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✅ Database schema ensured');

      // Ensure critical columns exist for backward compatibility with older DBs
      // Some deployments may have an older `Incidents` table without `location` or `media` JSON columns.
      // If missing, add them as nullable JSON columns then leave them for application-level enforcement.
      const [locationCol] = await conn.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Incidents' AND COLUMN_NAME = 'location'`
      );
      if (locationCol && locationCol[0] && locationCol[0].cnt === 0) {
        console.log('⚠️ Adding missing `location` column to `Incidents` table');
        await conn.query(`ALTER TABLE Incidents ADD COLUMN location JSON NULL`);
      }

      const [mediaCol] = await conn.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Incidents' AND COLUMN_NAME = 'media'`
      );
      if (mediaCol && mediaCol[0] && mediaCol[0].cnt === 0) {
        console.log('⚠️ Adding missing `media` column to `Incidents` table');
        await conn.query(`ALTER TABLE Incidents ADD COLUMN media JSON NULL`);
      }

      // Ensure Users.profilePicture is LONGTEXT (to allow long base64 or URL strings).
      const [profilePicInfo] = await conn.query(
        `SELECT COLUMN_TYPE, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'profilePicture'`
      );
      if (profilePicInfo && profilePicInfo[0]) {
        const dataType = profilePicInfo[0].DATA_TYPE?.toLowerCase();
        const columnType = profilePicInfo[0].COLUMN_TYPE?.toLowerCase();
        // Force upgrade to LONGTEXT to handle any size of data
        const needsUpgrade = !dataType?.includes('text') || dataType === 'text' || columnType?.startsWith('varchar') || columnType?.startsWith('blob');
        if (needsUpgrade) {
          console.log(`⚠️ Altering Users.profilePicture column from ${columnType} to LONGTEXT to support large values`);
          try {
            await conn.query('ALTER TABLE Users MODIFY COLUMN `profilePicture` LONGTEXT NULL');
            console.log('✅ Successfully altered profilePicture column to LONGTEXT');
          } catch (alterErr) {
            console.error('⚠️ Failed to alter profilePicture column:', alterErr.message);
          }
        }
      }

      // If older schemas have separate lat/lng columns that are NOT NULL, make them nullable.
      // This prevents INSERT failures when we insert via the `location` JSON column instead.
      for (const col of ['lat', 'lng']) {
        const [colInfo] = await conn.query(
          `SELECT IS_NULLABLE, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Incidents' AND COLUMN_NAME = ?`,
          [col]
        );
        if (colInfo && colInfo[0]) {
          const isNullable = colInfo[0].IS_NULLABLE === 'YES';
          const columnType = colInfo[0].COLUMN_TYPE; // e.g. 'double(10,6)'
          if (!isNullable) {
            console.log('⚠️ Altering Incidents.' + col + ' to allow NULL (was ' + columnType + ')');
            // Use MODIFY to preserve existing datatype
            await conn.query('ALTER TABLE Incidents MODIFY COLUMN `' + col + '` ' + columnType + ' NULL');
          }
        }
      }
  } finally {
    conn.release();
  }
}

module.exports = { initSchema };
