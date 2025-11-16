import multer from "multer";

const storage = multer.memoryStorage(); // buffer upload

export const upload = multer({ storage });
