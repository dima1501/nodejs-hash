const fs = require("fs").promises;
const crypto = require("crypto");
const fetch = require("node-fetch");
const { URL } = require("url");

const filePath = process.argv[2];
const filePathSHA = filePath + ".sha256";

const ErrorCodes = {
  FILE_NOT_READABLE: 100,
  HASH_NOT_READABLE: 101,
  HASHES_NOT_EQUAL: 102,
};

function isValidUrl(string) {
  try {
    new URL(string);
  } catch (err) {
    return false;
  }

  return true;
}

const checkHash = (fileData, hashData) => {
  const key = crypto.createHash("sha256").update(fileData).digest("hex");

  if (key !== hashData.toString().trim()) {
    console.log("Hashes is not equal!");
    process.exit(ErrorCodes.HASHES_NOT_EQUAL);
  } else {
    console.log("Hashes is equal!");
  }
};

async function main() {
  if (isValidUrl(filePath)) {
    const response = await fetch(filePath);
    const fileData = await response.buffer();
    const responseSHA = await fetch(filePathSHA);
    const hashData = await responseSHA.buffer();

    if (response.status == 404) {
      process.exit(ErrorCodes.FILE_NOT_READABLE);
    }

    if (responseSHA.status == 404) {
      process.exit(ErrorCodes.HASH_NOT_READABLE);
    }

    checkHash(fileData, hashData);
  } else {
    try {
      const getFilePromise = await fs.readFile(filePath);
      const getHashPromise = await fs.readFile(filePathSHA);
      checkHash(getFilePromise, getHashPromise);
    } catch (error) {
      if (error.code == "ENOENT") {
        if (error.path == filePath) {
          process.exit(ErrorCodes.FILE_NOT_READABLE);
        } else {
          process.exit(ErrorCodes.HASH_NOT_READABLE);
        }
      }
    }
  }
}

main()
  .then(() => {
    console.log("the end");
  })
  .catch((err) => console.log(err));
