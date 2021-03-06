import express from "express";
import fileUpload from "express-fileupload";
import os from "os";
import { mkdir, readdir, lstat, readFile, rmdir, writeFile } from "fs/promises";

const path = os.tmpdir() + "/back/";

export const start = () => {
  const app = express();
  const port = 3000;

  app.use(express.static("frontend"));
  app.use(fileUpload({
    headers: {
      "content-type": 'multipart/form-data'
    }
  }));

  app.get("/api/drive", (req, res) => {
    displayItems(res, path);
  });

  app.post("/api/drive", (req, res) => {
    addNewFolder(path + req.query.name, req, res);
  });

  app.put('/api/drive', (req, res) => {
    addFile(path, req.files.file, res);
  });

  app.delete("/api/drive/:name", (req, res) => {
    deleteItem(path + req.params.name, req, res);
  });

  app.get("/api/drive/*", (req, res) => {
    displayAccordingToItemType(path + req.params["0"],req, res);
  });

  app.post("/api/drive/*", (req, res) => {
    isFolder(path + req.params["0"], req)
      .then((isFolder) => {
        if (isFolder) {
          addNewFolder(path + req.params["0"] + req.query.name, req, res);
        } else {
          throw new Error('erreurrrrr');
        }
      })
      .catch(() => res.status(404).send("Le dossier n'existe pas"));
  });

  app.put('/api/drive/*', (req, res) => {
    if (req.params["0"]) {
      addFile(path + req.params["0"] + '/', req.files.file, res);
    } else {
      res.status(404).send("Le dossier n'existe pas");
    }
  });

  app.delete("/api/drive/*/:name", (req, res) => {
    isFolder(path + req.params["0"] + "/", req)
      .then((isFolder) => {
        if (isFolder) {
          const pathItem = path + req.params["0"] + "/" + req.params.name + "/";
          deleteItem(pathItem, req, res);
        } else {
          res.append("status", 404);
          throw new Error('erreurrrrr');
        }
      })
      .catch(error => console.log(error));
  });


  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

function addFile(pathFile, file, res) {
  writeFile(pathFile + file.name, file.data)
    .then(() => {
      displayItems(res, pathFile);
    })
    .catch(() => res.status(400).send("Aucun fichier pr??sent dans la requ??te"));
}

function deleteItem(pathItem, req, res) {
  rmdir(pathItem, { recursive: true })
    .then(() => {
      displayItems(res, path);
    })
    .catch(() => res.status(400).send("L'??l??ment n'a pas pu ??tre supprim??"));
}

function isFolder(pathFolder, req) {
  return lstat(pathFolder)
    .then(fullPath => {
      return fullPath.isDirectory();
    });
}

function addNewFolder(pathFolder, req, res) {
  const validFolderName = new RegExp("^[a-zA-Z]+$", "gm");
  if (validFolderName.test(req.query.name)) {
    createFolder(pathFolder, res);
  } else {
    res.status(400).send("Le dossier contient des caract??res non-alphanum??riques");
  }
}

function createFolder(pathFolder, res) {
  mkdir(pathFolder)
    .then(() => {
      displayItems(res, path);
    })
    .catch(error => {
      if (error.code == "EEXIST") {
        return res.status(400).send("Le dossier existe d??j??");
      }
    });
}

function displayAccordingToItemType(pathFolder, req, res) {
  lstat(pathFolder)
    .then((stats) => {
      if (stats.isDirectory()) {
        displayItems(res, pathFolder);
      } else if (stats.isFile()) {
        getFile(req, res);
      } else {
        res.status(400).send("error");
      }
    });
}

function getFile(req, res) {
  readFile(path + req.params.name, 'utf8')
    .then((fileContent) => {
      res.append("status", 200);
      res.append("Content-Type", "application/octet-stream");
      res.send(fileContent);
    });
}

function displayItems(res, path) {
  getArrayOfDirents(path)
    .then(dirents => {
      return Promise.all(LoopToCreateDatas(dirents, path));
    })
    .then(itemsArray => {
      res.append('status', 201);
      res.append("Content-Type", "application/json");
      res.send(itemsArray);
    })
}

function LoopToCreateDatas(dirents, path) {
  return dirents.map(dirent => populateJSON(dirent, path));
}

function getArrayOfDirents(path) {
  return readdir(path, { withFileTypes: true })
    .then((dirents) => dirents);
}

function populateJSON(dirent, path) {
  if (dirent.isDirectory()) {
    return {
      name: dirent.name,
      isFolder: true
    }
  } else {
    return getSize(dirent, path)
      .then(size => {
        return {
          name: dirent.name,
          isFolder: false,
          size: size
        }
      })
  }
}

function getSize(dirent, path) {
  return lstat(path + dirent.name).then(stat => stat.size)
}