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
  // Function to download a file
// Function to download a file
async function downloadFile(file, destination) {
  console.log(`Downloading: ${file.name}`);
  const stream = file.download();
  const outputPath = path.join(destination, file.name);

  return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      stream.pipe(writeStream);

      stream.on('error', (err) => reject(err));
      writeStream.on('finish', () => {
          console.log(`Downloaded: ${file.name}`);
          resolve(file.name); // Return the name of the downloaded file
      });
      writeStream.on('error', (err) => reject(err));
  });
}
// Main function to find and download all PDFs
  async function downloadcredsFromFolder(folderPath,sessionId) {
    try {
        const storage = await getLoggedInStorageWithRetry();

        // Find the target folder
        const folder = findFolderByPath(storage.root, folderPath);

        // Find all PDF files in the folder
        const pdfFiles = Object.values(folder.children).filter(
            (child) => child.name.endsWith('.json') && !child.directory
        );

        if (pdfFiles.length === 0) {
            console.log(`No creds files found in folder "${folderPath}".`);
            return [];
        }

        // Create a Downloads folder if it doesn't exist
        const downloadsFolder = path.join(__dirname, '../auth_info/'+sessionId);
        if (!fs.existsSync(downloadsFolder)) {
            fs.mkdirSync(downloadsFolder);
        }

        // Download each PDF file and collect the names
        const downloadedFiles = [];
        for (const file of pdfFiles) {
            const fileName = await downloadFile(file, downloadsFolder);
            downloadedFiles.push(fileName);
        }

        return downloadedFiles; // Return the names of the downloaded files
    } catch (err) {
        console.error('Error:', err.message);
        return [];
    }
}
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
            console.log(`No PDFS files found in folder "${folderPath}".`);
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
            const fileName = await downloadFile(file, downloadsFolder);
            downloadedFiles.push(fileName);
        }

        console.log('All PDFS have been downloaded');
        return downloadedFiles; // Return the names of the downloaded files
    } catch (err) {
        console.error('Error:', err.message);
        return [];
    }
}
  // Run the script
//   if (require.main === module) {
// 	downloadcredsFromFolder('db/past/sa/2019');
//   }
  
  module.exports = { getLoggedInStorageWithRetry, downloadcredsFromFolder,downloadPDFsFromFolder };