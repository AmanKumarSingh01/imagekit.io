const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
// AWS Config

AWS.config.update({
  region: "local",
  endpoint: "http://localhost:8000",
});

// Creating a dynamodb instance
const ddb = new AWS.DynamoDB.DocumentClient();
const TableName = "d-Image-Kit";

router.get("/image-kit", (req, res) => {
  console.log("scanning the database");
  let params = {
    TableName: TableName,
  };
  ddb.scan(params, function (err, data) {
    if (err) {
      console.error(err);
      res.send(err).status(400);
    } else {
      console.log("PutItem succeeded:", data);
      res.send(data).status(200);
    }
  });
});

// post

router.post("/image-kit", (req, res) => {
  let body = req.body;
  //Generating the unique id
  let id = new Date().getTime().toString();
  let checkparams = {
    TableName: TableName,
    KeyConditionExpression: "dummyid = :d",
    FilterExpression: "fpath = :n",
    ExpressionAttributeValues: {
      ":d": "dummy",
      ":n": req.body.fpath,
    },
  };
  ddb.query(checkparams, (err, result) => {
    if (err) return res.send(err).status(400);
    if (result.Items.length > 0) {
      return res.send("File with same name exist").status(400);
    }
    // sending data
    let params = {
      TableName: TableName,
      Item: {
        dummyid: "dummy",
        id: id,
        ...req.body,
        created_at: new Date().toTimeString(),
        updated_at: new Date().toTimeString(),
        filterpath: req.body.filterpath,
      },
    };
    // Setting flag
    let error = false;
    ddb.put(params, (err, result) => {
      if (err) return res.send(err).status(400);
      return res.send(result).status(200);
    });
  });

  //sending the data
});

// Get file by name
router.get("/image-kit/byname", (req, res) => {
  let name = req.headers.name;
  let params = {
    TableName: TableName,
    KeyConditionExpression: "dummyid = :d",
    FilterExpression: "fname = :n",
    ExpressionAttributeValues: {
      ":d": "dummy",
      ":n": name,
    },
  };
  ddb.query(params, (err, result) => {
    if (err) res.send(err).status(400);
    else res.send(result).status(200);
  });
});

// get file by path
router.get("/image-kit/path", (req, res) => {
  let name = req.headers.name;
  let params = {
    TableName: TableName,
    KeyConditionExpression: "dummyid = :d",
    FilterExpression: "fpath =:n",
    ExpressionAttributeValues: {
      ":d": "dummy",
      ":n": name,
    },
  };
  ddb.query(params, (err, result) => {
    if (err) res.send(err).status(400);
    else res.send(result).status(200);
  });
});

// get file size
router.get("/image-kit/size", (req, res) => {
  let name = req.headers.name;
  let params = {
    TableName: TableName,
    KeyConditionExpression: "dummyid = :id",
    FilterExpression: "contains (fpath, :n)",
    ExpressionAttributeValues: {
      ":id": "dummy",
      ":n": name,
    },
  };
  ddb.query(params, (err, result) => {
    if (err) res.send(err).status(400);
    let size = 0;
    result.Items.map((i) => {
      if (i.size) {
        size += parseInt(i.size);
      }
    });
    res.send(`The size of ${name} is ${size} kb`);
  });
});

// rename existing file

router.post("/image-kit/rename", async (req, res) => {
  let { oldpath, replacevalue  , oldvalue} = req.headers;
  let flag = false;
  console.log(oldpath, replacevalue, req.body.fpath);

  let params = {
    TableName: TableName,
    KeyConditionExpression: "dummyid = :d",
    FilterExpression: "fpath = :n",
    ExpressionAttributeValues: {
      ":d": "dummy",
      ":n": req.body.fpath,
    },
  };

  ddb.query(params, (err, result) => {
    if (err) {
      return res.send(JSON.stringify(err)).status(400);
    }
    if (result.Items.length > 0) {
      return res.send("File already exist");
    }
    // checking updating
    let updateparams = {
      TableName: TableName,
      Item: {
        ...req.body,
      },
    };
    ddb.put(updateparams, (err, result) => {
      if (err) {
        return res.send(JSON.stringify(err)).status(400);
      }
      //updating all relative paths
      let params = {
        TableName: TableName,
        KeyConditionExpression: "dummyid = :id",
        FilterExpression: "contains (fpath, :n)",
        ExpressionAttributeValues: {
          ":id": "dummy",
          ":n": oldpath,
        },
      };
      ddb.query(params, (err, result) => {
        if (err) res.send(err).status(400);
        let size = 0;
        console.log(result.Items);
        result.Items.map((i) => {
          let data = {
            TableName: TableName,
            Item: {
              ...i,
              fpath: i.fpath.replace(oldvalue, replacevalue),
            },
          };
          ddb.put(data, (err, result) => {
            if (err) {
              return res.send(JSON.stringify(err)).status(400);
            }
            console.log("Inside querry", data);
            return res.send(`sucessfull`).status(400);
          });
        });
      });
    });
  });
});

router.get("/image-kit/bynameandtype", (req, res) => {
  let { name, type } = req.headers;
  let params = {
    TableName: TableName,
    KeyConditionExpression: "dummyid = :id",
    FilterExpression: "fname = :n and ftype = :t ",
    ExpressionAttributeValues: {
      ":id": "dummy",
      ":n": name,
      ":t": type,
    },
  };
  ddb.query(params, (error, result) => {
    if (error) {
      return res.send("error encoutered").status(400);
    }
    if (result.Items.length === 0) {
      return res.send("Not Found").status(200);
    }
    return res.send(result).status(200);
  });
});

module.exports = router;
