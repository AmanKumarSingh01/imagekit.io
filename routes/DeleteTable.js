const AWS = require("aws-sdk");
AWS.config.update({
  region: "local",
  endpoint: "http://localhost:8000",
});
var dynamodb = new AWS.DynamoDB();
var params = {
    TableName: 'd-Image-Kit',
};
dynamodb.deleteTable(params, function (err, data) {
  if (err) console.log(err);
  // an error occurred
  else console.log(data); // successful response
});
