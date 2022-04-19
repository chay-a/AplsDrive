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
import { mkdir } from "fs/promises";
import { readdir, lstat, readFile } from "fs/promises";

export const start = () => {
  const app = express();
  const port = 3000;
  const path = os.tmpdir() + "/back/";

  app.use(express.static("frontend"));

  app.post("/api/drive", (req, res) => {
    res.append("status", 200);
    res.append("Content-Type", "application/json");
    mkdir(path + req.query.name);
  });

  app.get("/api/drive", (req, res) => {
    res.append("status", 200);
    res.append("Content-Type", "application/json");
    getDatas(res, path);
  });

  app.get("/api/drive/:name", (req, res) => {
    lstat(path + req.params.name).then((response) => {
      if (response.isDirectory()) {
        res.append("status", 200);
        res.append("Content-Type", "application/octet-stream");
        getDatas(res, path + req.params.name + "/");
      } else if (response.isFile()) {
        res.append("status", 200);
        res.append("Content-Type", "application/octet-stream");
        readFile(path + req.params.name, 'utf8').then((response)=> {
            console.log(response);
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
  let datas = [];
  let promises = [];
  const dir = readdir(path)
    .then((response) => {
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
    })
    .then(() => {
      Promise.all(promises).then(() => {
        res.send(datas);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
