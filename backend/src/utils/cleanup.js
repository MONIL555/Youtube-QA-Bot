import fs from 'fs';
import path from 'path';

export const cleanupTempFiles = () => {
  const dirsToClean = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'temp'),
    path.join(process.cwd(), 'temp_insta')
  ];

  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        let deletedCount = 0;
        for (const file of files) {
          const filePath = path.join(dir, file);
          // Only delete files, not directories (unless recursive is needed, but we only have files)
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
        if (deletedCount > 0) {
          console.log(`Cleaned up ${deletedCount} temporary file(s) in ${dir}`);
        }
      } catch (err) {
        console.error(`Failed to clean up directory ${dir}:`, err.message);
      }
    }
  }
};
