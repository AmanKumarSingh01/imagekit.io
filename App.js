const urlextendor = require("body-parser").urlencoded({ extended: true });
const json = require("body-parser").json();
const express = require("express");
const cors = require("cors");
const api = require("./routes/create");
const app = express();
const port = 3000;

app.use(json);

app.use(urlextendor);

app.use(cors());

app.use("/v1/api", api);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
