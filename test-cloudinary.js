const cloudinary = require('./backend/src/utils/cloudinary.js');
const url = cloudinary.generateSignedUrl('v1778793506/club-timoteo/destacamentos/DES/perfiles/ID');
console.log(url);
