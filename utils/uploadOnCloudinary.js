const cloudinary = require('cloudinary').v2;
const fs = require('fs');
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async(localFilePath) => {
    try{

        if(!localFilePath){
            return null;
        }

        const res = await cloudinary.uploader.upload(localFilePath, {
            folder: 'submittedAssignment',
            resource_type: 'raw',
            type : "authenticated",
        });

        // if file is uploaded on cloudinary then delete it from file system
        fs.unlinkSync(localFilePath);
        return res.secure_url;
    }catch(error){
        console.log(error);
        fs.unlinkSync(localFilePath);
        return null;
    }
}

