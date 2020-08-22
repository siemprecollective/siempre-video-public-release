const fs = require('fs');
const https = require('https');
const Websocket = require('ws');

var admin = require('firebase-admin');
var serviceAccount = require("BLANK");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "BLANK"
});
const admin_db = admin.firestore();

const server = https.createServer({
  cert: fs.readFileSync('BLANK'),
  key: fs.readFileSync('BLANK')
});
const wss = new Websocket.Server({ server })

id_to_socket = {};
up_to_date = {};
inactive_timers = {};
controlling_uuid = {};

async function handleEvent(event, data, client) {
  if (event === "ping") {
    console.log("pong", client.userId);
    client.send(JSON.stringify({"event": "pong"}));
    return;
  } else if (event === "identify") {
    if ((typeof data !== "object") ||
        !("token" in data) ||
        !("uuid" in data)) {
      console.log("invalid identify");
      client.send(JSON.stringify({"event": "reload"}));
      client.terminate();
      return;
    }
    let token;
    try {
      token = await admin.auth().verifyIdToken(data.token);
    } catch (err) {
      client.terminate();
      console.log("identify: unrecognized token");
      return;
    }
    console.log("identify", token.uid);
    client.userId = token.uid;
    client.isAlive = true;
    client.uuid = data.uuid;
    if (!(client.userId in id_to_socket)) {
      id_to_socket[client.userId] = {};
    }
    if (client.uuid in id_to_socket[client.userId]) {
      console.log("cleaning up stale connection for %s", client.uuid);
      // client died but came back before they were timed out
      // we need to get rid of the old connection
      // TODO: this is a bit of a hack to not interfere with the close handler
      id_to_socket[client.userId]["gc"] = id_to_socket[client.userId][client.uuid];
      id_to_socket[client.userId]["gc"].uuid = "gc";
      id_to_socket[client.userId]["gc"].terminate();
      delete id_to_socket[client.userId][client.uuid];
    }
    id_to_socket[client.userId][client.uuid] = client;
    if (!up_to_date[client.uuid]) {
      console.log("force reloading", client.userId);
      up_to_date[client.uuid] = true;
      client.send(JSON.stringify({"event": "reload"}));
      client.terminate();
      return;
    }
    if (!(client.userId in controlling_uuid)) {
      admin_db.collection("users").doc(client.userId).update({
        "controllingUUID": client.uuid
      });
      controlling_uuid[client.userId] = client.uuid;
    }
    if (controlling_uuid[client.userId] === client.uuid) {
      clearTimeout(inactive_timers[client.userId]);
      delete inactive_timers[client.userId];
      admin_db.collection("users").doc(client.userId).update({
        "active": true,
      });
    }
  } else if (event === "assert_control") {
    console.log("assert_control", client.userId, client.uuid);
    if (client.userId in inactive_timers) {
      clearTimeout(inactive_timers[client.userId]);
      delete inactive_timers[client.userId];
    }
    admin_db.collection("users").doc(client.userId).update({
      "active": true,
      "controllingUUID": client.uuid
    });
    controlling_uuid[client.userId] = client.uuid;
  } else if (event === "signal" || event === "request_offer") {
    if (!("uuid" in client) || !("userId" in client) || !(client.userId in id_to_socket)) {
      console.log("dropping message (from unrecognized client)");
      client.terminate();
      return;
    } else if (client.uuid !== controlling_uuid[client.userId]) {
      console.log("dropping", client.userId, "->", data.to, "(from non-controlling client", client.uuid, "expected", controlling_uuid[client.userId], ")");
      return;
    } else if (!(data.to in controlling_uuid) || !(data.to in id_to_socket)) {
      console.log("dropping", client.userId, "->", data.to, "(unrecognized destination)");
      return;
    } else if (!(controlling_uuid[data.to] in id_to_socket[data.to])) {
      console.log("dropping", client.userId, "->", data.to, "(controlling device closed)");
      return;
    } else {
      console.log(event, client.userId, "->", data.to);
      let newPayload = JSON.stringify({
        event: event,
        data: {
          from: client.userId,
          to: data.to,
          data: data.data
        }
      });
      id_to_socket[data.to][controlling_uuid[data.to]].send(newPayload);
    }
  } else {
    console.log("unrecognized event", event, client.userId);
  }
}

wss.on("connection", client => {
  client.on("message", async payload => {
    let msg;
    try {
      msg = JSON.parse(payload);
    } catch (err) {
      console.log("error parsing JSON");
      return;
    }
    let event = msg.event;
    let data = msg.data;
    try {
      handleEvent(event, data, client);
    } catch (err) {
      console.log("uncaught client error. out of date? reloading.");
      client.send(JSON.stringify({"event": "reload"}));
      client.terminate();
    }
  })

  client.on("pong", () => {
    //console.log("pong", client.userId);
    client.isAlive = true;
  });

  client.on("close", (code, reason) => {
    console.log("close", client.userId);
    if (client.userId) {
      if (client.uuid === controlling_uuid[client.userId]) {
        admin_db.collection("users").doc(client.userId).update({
          "active": false,
        });
        // if user doesn't come back in 60 seconds, make them offline
        // TODO change this for mobile-- should continue to be online if they've
        // set a timed online status
        inactive_timers[client.userId] = setTimeout(() => {
          admin_db.collection("users").doc(client.userId).update({"status": 2});
        }, 60000);
      }
      delete id_to_socket[client.userId][client.uuid];
    }
  });

  client.on("error", (err) => {
    console.log("ws client error:", err);
  });
})
wss.on("error", err => {
  console.log("wss error: ", err);
});

const interval = setInterval(function ping() {
  wss.clients.forEach((client) => {
    if (client.isAlive === false) {
      console.log("timed out", client.userId);
      return client.terminate();
    }
    client.isAlive = false;
    //console.log("ping", client.userId);
    client.ping(() => {});
  });
}, 30000);

process.on("SIGUSR2", () => {
  console.log("reloading clients; currently active:");
  Object.keys(up_to_date).forEach((id) => {
    delete up_to_date[id];
  });
  wss.clients.forEach((client) => {
    console.log(client.userId, client.uuid);
    up_to_date[client.uuid] = true;
    client.send(JSON.stringify({"event": "reload"}));
  });
});

admin_db.collection("users").get().then((query) => {
  query.forEach((doc) => {
    let controllingUUID = doc.data()["controllingUUID"]
    if (controllingUUID !== undefined) {
      controlling_uuid[doc.ref.id] = controllingUUID;
    }
    doc.ref.update({
      "active": false,
    });
  });
  server.listen(9001);
});
