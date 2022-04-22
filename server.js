// exports.start = () => {
//     const express = require('express');
//     const app = express();
//     const port = 3000;
//     const os = require('os');

//     app.use(express.static("frontend"));

//   app.get("/api/drive", (req, res) => {
//     console.log(os.tmpdir());
//     res.send([
//       {
//         name: "Personnel",
//         isFolder: true,
//       },
//       {
//         name: "avis imposition",
//         size: 1337,
//         isFolder: false,
//       },
//     ]);
//   });

//   app.get("/api/drive/:name", (req, res) => {
//     let data;
//     if (req.params.name === "Personnel") {
//       data = [
//         {
//           name: "Autre dossier",
//           isFolder: true,
//         },
//         {
//           name: "passeport",
//           size: 1003,
//           isFolder: false,
//         },
//       ];
//     } else if (req.params.name === "avis imposition") {
//       data = "hello";
//     } else {
//       data = "error";
//     }
//     res.send(data);
//   });

//   app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
//   });
//}

import express from "express";
import os from "os";
import { mkdir, readdir, lstat, readFile, rmdir, writeFile } from "fs/promises";

const path = os.tmpdir() + "/back/";

export const start = () => {
  const app = express();
  const port = 3000;

  app.use(express.static("frontend"));

  app.get("/api/drive", (req, res) => {
    displayItems(res, path);
  });

  app.post("/api/drive", (req, res) => {
    addNewFolder(path + req.query.name, req, res);
  });

  app.put('/api/drive', (req, res) => {
    console.log(req.files);
  });
  
  app.get("/api/drive/:name", (req, res) => {
    displayAccordingToItemType(req, res);
  });
  
  app.post("/api/drive/:folder", (req, res) => {
    isFolder(req)
      .then((isFolder) => {
        if (isFolder) {
          addNewFolder(path + req.params.folder + '/' + req.query.name, req, res);
        } else {
          res.append("status", 404);
          throw new Error('erreurrrrr');
        }
      })
      .catch(error => console.log(error));
  });

  app.delete("/api/drive/:name", (req, res) => {
    deleteItem(path + req.params.name,req, res);
  });

  app.delete("/api/drive/:folder/:name", (req, res) => {
    isFolder(req)
    .then((isFolder) => {
      if (isFolder) {
        const pathItem = path + req.params.folder + '/' + req.params.name;
        deleteItem(pathItem,req, res);
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

function deleteItem(pathItem, req, res) {
    rmdir(pathItem, { recursive: true })
      .then(() => {
        displayItems(res, path);
      });
}

function isFolder(req) {
  return lstat(path + req.params.folder)
    .then(fullPath => {
      if (fullPath.isDirectory()) {
        return true;
      } else {
        return false;
      }
    });
}

function addNewFolder(pathFolder, req, res) {
  const validFolderName = new RegExp("^[a-zA-Z]+$", "gm");
  if (validFolderName.test(req.query.name)) {
    createFolder(pathFolder, res);
  } else {
    res.append("status", 400);
    console.log('nom de dossier non valide');
  }
}

function createFolder(pathFolder, res) {
  mkdir(pathFolder)
    .then(() => {
      displayItems(res, path);
    })
    .catch(error => {
      if (error.code == "EEXIST") {
        return console.log('dossier existe déjà');
      }
    });
}

function displayAccordingToItemType(req, res) {
  lstat(path + req.params.name)
    .then((stats) => {
      if (stats.isDirectory()) {
        displayItems(res, path + req.params.name + "/");
      } else if (stats.isFile()) {
        getFile(req, res);
      } else {
        res.append("status", 404);
        res.send("error");
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