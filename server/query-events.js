var admin = require('firebase-admin');
var serviceAccount = require("BLANK");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "BLANK"
});
const admin_db = admin.firestore();

admin_db.collection("events")
  .where("time", ">", new Date("2019-10-03"))
  .where("time", "<", new Date("2019-10-06"))
  .get().then((query) => {
    let totalDocs = 0;
    query.forEach(doc => {
      totalDocs += 1;
      console.log(JSON.stringify(doc.data()));
    });
    console.log("total:", totalDocs);
});
