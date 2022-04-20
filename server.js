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
import { mkdir, readdir, lstat, readFile } from "fs/promises";

export const start = () => {
  const app = express();
  const port = 3000;
  const path = os.tmpdir() + "/back/";

  app.use(express.static("frontend"));

  app.post("/api/drive", (req, res) => {
    const validFolderName = new RegExp("^[a-zA-Z]+$", "gm");
    if (validFolderName.test(req.query.name)) {
      mkdir(path + req.query.name)
        .then(() => {
          res.append("status", 200);
          res.append("Content-Type", "application/json");
          getDatas(res, path);
        })
        .catch(error => {
          if (error.code == "EEXIST") {
            return console.log('dossier existe déjà');
          }
        });
    } else {
      res.append("status", 400);
      console.log('nom de dossier non valide');
    }
  });

  app.get("/api/drive", (req, res) => {
    res.append("status", 200);
    res.append("Content-Type", "application/json");
    getDatas(res, path);
  });

  app.post("/api/drive/:folder", (req, res) => {
    lstat(path + req.params.folder)
      .then((fullPath) => {
        if (fullPath.isDirectory()) {
          const validFolderName = new RegExp("^[a-zA-Z]+$", "gm");
          if (validFolderName.test(req.query.name)) {
            mkdir(path + req.params.folder + '/' + req.query.name)
              .then(() => {
                res.append("status", 200);
                res.append("Content-Type", "application/json");
                getDatas(res, path);
              })
              .catch(error => {
                if (error.code == "EEXIST") {
                  return console.log('dossier existe déjà');
                }
              });
          } else {
            res.append("status", 400);
            console.log('nom de dossier non valide');
          }
        } else {
          res.append("status", 404);
          throw new Error('erreurrrrr');
        }
      })
      .catch(error => console.log(error))
  })

  app.get("/api/drive/:name", (req, res) => {
    lstat(path + req.params.name).then((response) => {
      if (response.isDirectory()) {
        res.append("status", 200);
        res.append("Content-Type", "application/json");
        getDatas(res, path + req.params.name + "/");
      } else if (response.isFile()) {
        res.append("status", 200);
        res.append("Content-Type", "application/octet-stream");
        readFile(path + req.params.name, 'utf8').then((response) => {
          res.send(response);
        })
      } else {
        res.append("status", 404);
        res.send("error");
      }
    });
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

function getDatas(res, path) {

  let promises = [];
  const dir = readdir(path)
    .then((response) => {
      let datas = [];
      for (const file of response) {
        let data = {};
        promises.push(
          lstat(path + file)
            .then((response) => {
              data.name = file;
              if (response.isDirectory()) {
                data.isFolder = true;
              } else {
                data.isFolder = false;
                data.size = response.size;
              }
              datas.push(data);
            })
            .catch((error) => {
              console.log(error);
            })
        );
      }
      return datas;
    })
    .then((datas) => {
      Promise.all(promises).then(() => {
        res.send(datas);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
