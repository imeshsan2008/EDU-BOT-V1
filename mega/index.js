const { Storage } = require('megajs');
const fs = require('fs');
const path = require('path');

// Function to get logged-in MEGA storage with retries
async function getLoggedInStorageWithRetry(maxRetries = 3, retryDelay = 2000) {
  const email = 'imeshsan2008@gmail.com';
  const password = 'Imeshsandeepa018@';
  const userAgent = 'MEGAJS-Demos (+https://mega.js.org/)';

  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      console.log(`Attempt ${attempts + 1} to log in...`);
      const storage = new Storage({ email, password, userAgent });
      return await storage.ready;
    } catch (err) {
      attempts++;
      console.error(`Login attempt ${attempts} failed:`, err.message);

      if (attempts >= maxRetries) {
        throw new Error(`Failed to log in after ${maxRetries} attempts.`);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

// Function to find a folder by path
function findFolderByPath(root, folderPath) {
  const pathSegments = folderPath.split('/'); // Split path into parts
  let currentFolder = root;

  for (const segment of pathSegments) {
    currentFolder = Object.values(currentFolder.children).find(
      (child) => child.name === segment && child.directory
    );

    if (!currentFolder) {
      throw new Error(`Folder "${folderPath}" not found.`);
    }
  }

  return currentFolder;
}
// Function to download a file and rename it by adding the current date and timestamp
async function downloadFile(file, destination) {
  console.log(`Downloading: ${file.name}`);
  const oldName = file.name;

  // Get current timestamp in 'YYYY-MM-DD_HH-MM-SS' format
  const timestamp = Date.now();

  // Create a new filename by adding the timestamp to the original name
  const newFileName = `${timestamp}_${file.name}`;

  const stream = file.download();
  const outputPath = path.join(destination, newFileName); // Save with the new name

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);
    stream.pipe(writeStream);

    stream.on('error', (err) => reject(err));
    writeStream.on('finish', () => {
      console.log(`Downloaded: ${newFileName}`);
      resolve({ oldName, newFileName }); // Return both old and new file names
    });
    writeStream.on('error', (err) => reject(err));
  });
}

// Function to download PDFs from a folder
async function downloadPDFsFromFolder(folderPath) {
  try {
    const storage = await getLoggedInStorageWithRetry();

    // Find the target folder
    const folder = findFolderByPath(storage.root, folderPath);

    // Find all PDF files in the folder
    const pdfFiles = Object.values(folder.children).filter(
      (child) => child.name.endsWith('.pdf') && !child.directory
    );

    if (pdfFiles.length === 0) {
      console.log(`No PDF files found in folder "${folderPath}".`);
      return [];
    }

    // Create a Downloads folder if it doesn't exist
    const downloadsFolder = path.join(__dirname, '../tmp');
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder);
    }

    // Download each PDF file and collect the names
    const downloadedFiles = [];
    for (const file of pdfFiles) {
      const fileDetails = await downloadFile(file, downloadsFolder);
      downloadedFiles.push(fileDetails);
    }

    console.log('All PDFs have been downloaded.');
    console.log('Downloaded files:', downloadedFiles);

    return downloadedFiles; // Returns an array of objects with oldName and newFileName
  } catch (err) {
    console.error('Error:', err.message);
    return [];
  }
}


module.exports = { getLoggedInStorageWithRetry, downloadPDFsFromFolder };
