
const multer = require('multer');
const sharp = require('sharp');
const blob = require('../utils/azure_blob_helper');
const stream = require('stream');



const uploadParams = {
    limits: {
        fileSize: 8 * 1024 * 1024, // 8 MB file size limit for all file types except zip
    },
    fileFilter: (file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'text/csv', 'text/css', 'audio/mpeg', 'video/mp4', 'application/vnd.ms-powerpoint', 'application/vnd.rar'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type, only PDF, DOC, CSV, CSS, MP3, MP4, PPT, RAR, JPEG, and PNG files are allowed'));
        }
        cb(null, true);
    },
};



module.exports = {
    async uploadFile(file) {
        return new Promise(async (resolve, reject) => {
                const timestamp = new Date().toISOString().replace(/:/g, '-');
                const fileName = `${timestamp}-${file.originalname}`;


                if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                    const resizedImage = await sharp(file.buffer).resize(800).jpeg({ quality: 80 }).toBuffer();
                    
                    uploadResponse = await blob.upload('images', resizedImage, fileName);
                } else {
                    const sizeLimit = file.mimetype === 'application/zip' ? 15 * 1024 * 1024 : 8 * 1024 * 1024;
                    if (file.size > sizeLimit) {
                        return reject(`File size exceeds limit of ${sizeLimit / 1024 / 1024} MB`);
                    }
                    const uploadedFile = new stream.PassThrough();
                    uploadedFile.end(file.buffer);
                    const type = file.mimetype.split('/')[1];
                    uploadResponse = await blob.upload(type ,uploadedFile, fileName, true);
                }

                let response = {
                    name: fileName,
                    url: uploadResponse.url,
                    requestId: uploadResponse.requestId,
                    message: `File was uploaded successfully.`

                }
            resolve(response);
        })
    },

    async uploadFileAsStream(fileStream, originalname, mimetype) {
        return new Promise(async (resolve, reject) => {
            try {
                const timestamp = new Date().toISOString().replace(/:/g, '-');
                const fileName = `${timestamp}-${originalname}`;
    
                if (mimetype === 'image/jpeg' || mimetype === 'image/png') {
                    const resizedImageStream = fileStream.pipe(sharp().resize(800).jpeg({ quality: 80 }));
    
                    const uploadResponse = await blob.upload('images', resizedImageStream, fileName);
                    
                    const response = {
                        name: fileName,
                        url: uploadResponse.url,
                        requestId: uploadResponse.requestId,
                        message: `File was uploaded successfully.`
                    };
    
                    resolve(response);
                } else {
                    const sizeLimit = mimetype === 'application/zip' ? 15 * 1024 * 1024 : 100 * 1024 * 1024;
                    let uploadedFileSize = 0;
    
                    const sizeCounterStream = new stream.Transform({
                        transform(chunk, encoding, callback) {
                            uploadedFileSize += chunk.length;
                            this.push(chunk);
                            callback();
                        }
                    });
    
                    fileStream.pipe(sizeCounterStream);
    
                    if (uploadedFileSize > sizeLimit) {
                        return reject(`File size exceeds limit of ${sizeLimit / 1024 / 1024} MB`);
                    }
    
                    const uploadResponse = await blob.upload(mimetype.split('/')[1], sizeCounterStream, fileName, true);
    
                    const response = {
                        name: fileName,
                        url: uploadResponse.url,
                        requestId: uploadResponse.requestId,
                        message: `File was uploaded successfully.`
                    };
    
                    resolve(response);
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                reject(error);
            }
        });
    }
}

