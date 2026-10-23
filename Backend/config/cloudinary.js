import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (fileData, folder = 'pulsechat') => {
    // If Cloudinary keys are configured, upload to Cloudinary
    if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
    ) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(fileData, {
                folder,
                resource_type: 'auto'
            });
            return uploadResponse.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            // Fallback to data URL if Cloudinary upload encounters an issue
            return fileData;
        }
    }

    // Return the image data / URL directly if Cloudinary keys are not set yet
    return fileData;
};

export default cloudinary;
