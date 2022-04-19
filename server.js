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

export const start = () => {
  const app = express();
  const port = 3000;

  app.use(express.static("frontend"));

  app.get("/api/drive", (req, res) => {
    res.send([
      {
        name: "Personnel",
        isFolder: true,
      },
      {
        name: "avis imposition",
        size: 1337,
        isFolder: false,
      },
    ]);
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
