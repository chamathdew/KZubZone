const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Uploads a local file to Cloudinary or saves it locally as a fallback
 * @param {string} localFilePath Path to the temporary uploaded file
 * @param {string} folder Target folder name on Cloudinary or public directory
 * @returns {Promise<string>} URL of the uploaded asset
 */
const uploadAsset = async (localFilePath, folder = 'kdramaverse') => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      throw new Error(`File does not exist: ${localFilePath}`);
    }

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: folder,
        resource_type: 'auto'
      });
      // Delete temporary local file
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Error unlinking temp file:', err);
      }
      return result.secure_url;
    } else {
      // Fallback: copy file to public uploads folder
      const publicUploadsDir = path.join(__dirname, '..', 'public', 'uploads', folder);
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }

      const fileName = path.basename(localFilePath);
      const destinationPath = path.join(publicUploadsDir, fileName);
      fs.copyFileSync(localFilePath, destinationPath);
      
      // Delete temporary local file
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Error unlinking temp file:', err);
      }

      // Return local URL
      return `/uploads/${folder}/${fileName}`;
    }
  } catch (error) {
    console.error('Cloudinary/Local Upload Error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadAsset,
  isCloudinaryConfigured
};
