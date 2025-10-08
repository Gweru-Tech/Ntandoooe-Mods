const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        await fs.ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|ogg|mp4|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, audio, and video files are allowed!'));
        }
    }
});

// Upload single file
router.post('/single', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                url: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        
        const files = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            url: `/uploads/${file.filename}`
        }));
        
        res.json({
            success: true,
            message: 'Files uploaded successfully',
            files: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
});

// Delete file
router.delete('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);
        
        await fs.remove(filePath);
        
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Delete failed',
            error: error.message
        });
    }
});

// List uploaded files
router.get('/list', async (req, res) => {
    try {
        const uploadsPath = path.join(__dirname, '../uploads');
        const files = await fs.readdir(uploadsPath);
        
        const fileList = await Promise.all(files.map(async (filename) => {
            const filePath = path.join(uploadsPath, filename);
            const stats = await fs.stat(filePath);
            return {
                filename,
                size: stats.size,
                created: stats.birthtime,
                url: `/uploads/${filename}`
            };
        }));
        
        res.json({
            success: true,
            files: fileList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to list files',
            error: error.message
        });
    }
});

module.exports = router;
