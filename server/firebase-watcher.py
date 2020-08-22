import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import messaging
from firebase_admin import auth

import apns2
from apns2.client import APNsClient
from apns2.payload import Payload

import traceback
import time
from datetime import datetime
from threading import Timer

from send_as_support import send_message

USER_COLLECTION = "users"
FRIEND_REQUEST_COLLECTION = "friend-requests"
ROOM_COLLECTION = "rooms"
STATUS_COLLECTION = "statuses"
EVENT_COLLECTION = "events"

STATUS_EVENT_TYPE = u"status change"
ROOM_JOIN_EVENT_TYPE = u"room join"
ROOM_EXIT_EVENT_TYPE = u"room exit"

cred = credentials.Certificate("BLANK");
firebase_admin.initialize_app(cred)
db = firestore.client()

last_rooms = {}
last_users = {}
timers = {}

def timeout_status(uid):
  db.collection(USER_COLLECTION).document(uid).update({
    "status": 2,
    "statusTimeout": None,
  })

def watch_users(docs, changes, read_time):
  for change in changes:
    try:
      if (change.type.name == "ADDED") or (change.type.name == "MODIFIED"):
        user_doc = change.document.to_dict()
        plugged_in = user_doc["pluggedIn"]
        for key in plugged_in:
          view = {}
          view["name"] = user_doc["name"]
          if "profilePicturePath" in user_doc:
            view["profilePicturePath"] = user_doc["profilePicturePath"]
          if "active" in user_doc:
            view["active"] = user_doc["active"]
          if ("statusTimeout" in user_doc) and \
             (isinstance(user_doc["statusTimeout"], datetime)):
            view["active"] = True
          if ("controllingUUID" in user_doc):
            view["onMobile"] = user_doc["controllingUUID"].startswith('mobile')
          view["status"] = 2
          view["inPrivate"] = False
          view["roomId"] = u""
          view["textStatus"] = u""
          if plugged_in[key]:
            view["status"] = user_doc["status"]
            if "inPrivate" in user_doc:
              view["inPrivate"] = user_doc["inPrivate"]
            if "roomId" in user_doc:
              view["roomId"] = user_doc["roomId"]
            if "textStatus" in user_doc:
              view["textStatus"] = user_doc["textStatus"]
          if not db.collection(STATUS_COLLECTION).document(key).get().exists:
            db.collection(STATUS_COLLECTION).document(key).set({})
          db.collection(STATUS_COLLECTION).document(key).update({change.document.id: view})
        if ("statusTimeout" in user_doc):
          if change.document.id in timers:
            timers[change.document.id].cancel()
          if (isinstance(user_doc["statusTimeout"], datetime)):
            timeout = user_doc["statusTimeout"].timestamp() - time.time()
            print("timing out", change.document.id, timeout)
            timers[change.document.id] = Timer(timeout, lambda: timeout_status(change.document.id))
            timers[change.document.id].start()
        if change.document.id in last_users:
          if last_users[change.document.id]["status"] != user_doc["status"]:
            db.collection(EVENT_COLLECTION).document().set({
              "type": STATUS_EVENT_TYPE,
              "user": change.document.id,
              "status": user_doc["status"],
              "time": firestore.SERVER_TIMESTAMP
            })
        last_users[change.document.id] = user_doc
    except Exception as e:
      print(traceback.print_exc())

def watch_rooms(docs, changes, read_time):
  for change in changes:
    try:
      if (change.type.name == "ADDED") or \
         (change.type.name == "MODIFIED") or \
         (change.type.name == "REMOVED"):
        room = change.document.to_dict()
        if (change.type.name == "REMOVED"):
          room["users"] = []
        if (change.document.id not in last_rooms):
          last_rooms[change.document.id] = {"users": []}
        last_room = last_rooms[change.document.id]

        isPrivate = room.get("isPrivate", False)
        for userid in room["users"]:
          db.collection(USER_COLLECTION).document(userid).update({
            "inPrivate": isPrivate
          })
          if userid not in last_room["users"]:
            db.collection(EVENT_COLLECTION).document().set({
              "type": ROOM_JOIN_EVENT_TYPE,
              "user": userid,
              "room": change.document.id,
              "isPrivate": isPrivate,
              "time": firestore.SERVER_TIMESTAMP
            })
            notifData = {
              "room": change.document.id,
              "inCall": json.dumps(room["users"])
            }
            payload = Payload(alert="", custom=notifData)
            if (userid in last_users) and \
               ("controllingUUID" in last_users[userid]) and \
               (last_users[userid]["controllingUUID"].startswith("mobile:")) and \
               (not last_users[userid]["active"]):
              # TODO slight race here where user is inaccessible after
              # disconnecting from websocket but before we realize it
              print(last_users[userid])
              if "APNSPushToken" in last_users[userid]:
                # TODO check if on mobile
                isDev = ("APNSDev" in last_users[userid]) and \
                        (last_users[userid]["APNSDev"])
                apns_client = APNsClient(
                  'BLANK',
                  use_sandbox=isDev
                )
                apns_client.send_notification(
                  last_users[userid]["APNSPushToken"],
                  payload,
                  "BLANK"
                )
              if "FCMToken" in last_users[userid]:
                message = messaging.Message(data=notifData,
                        token=last_users[userid]['FCMToken'])
                response = messaging.send(message)
                print('Sent call notification to {}, response {}'.format(userid, response))
        for userid in last_room["users"]:
          if userid not in room["users"]:
            db.collection(USER_COLLECTION).document(userid).update({
              "inPrivate": False
            })
            db.collection(EVENT_COLLECTION).document().set({
              "type": ROOM_EXIT_EVENT_TYPE,
              "user": userid,
              "room": change.document.id,
              "isPrivate": isPrivate,
              "time": firestore.SERVER_TIMESTAMP
            })
        if len(room["users"]) == 1:
          last_user = list(room["users"].keys())[0]
          db.collection(USER_COLLECTION).document(last_user).update({
            "roomId": ""
          })
          change.document.reference.delete()

        last_rooms[change.document.id] = room

    except Exception as e:
      print(traceback.print_exc())

def watch_friend_requests(docs, changes, read_time):
  for change in changes:
    try:
      if (change.type.name == "ADDED") or \
         (change.type.name == "MODIFIED"):
        friend_request = change.document.to_dict()

        if not "fromId" in friend_request:
          continue
        fromid = friend_request["fromId"]
        fromuser = db.collection(USER_COLLECTION).document(fromid).get().to_dict()
        frompicturepath = ''
        if 'profilePicturePath' in fromuser:
          frompicturepath = fromuser['profilePicturePath']
        if not "fromEmail" in friend_request:
          change.document.reference.update({
            "fromEmail": auth.get_user(fromid).email,
            "fromName": fromuser["name"],
            "fromPicturePath": frompicturepath
          })

        toid = None
        if not "toId" in friend_request and "toEmail" in friend_request:
          toemail = friend_request["toEmail"].strip()
          change.document.reference.update({
              "toEmail": toemail
          })
          try:
            toid = auth.get_user_by_email(toemail).uid
            change.document.reference.update({
              "toId": toid
            })
          except:
            if not "sentEmail" in friend_request:
              existing_requests_query = db.collection(FRIEND_REQUEST_COLLECTION)\
                .where("toEmail", "==", toemail).get()
              existing_requests = list(existing_requests_query)
              if len(existing_requests) > 1:
                continue
              print("sending email")
              email_subject = "%s invites you to use BLANK!" % (fromuser["name"],)
              email_message = """
%s (%s) would like you to use BLANK with you!
          """ % (fromuser["name"], auth.get_user(fromid).email)
              send_message(toemail, email_subject, email_message)
              change.document.reference.update({
                "sentEmail": True
              })

        if not "toId" in friend_request:
          continue

        toid = friend_request["toId"]
        existing_requests = db.collection(FRIEND_REQUEST_COLLECTION)\
                   .where("toId", "==", fromid)\
                   .where("fromId", "==", toid).get()

        batch = db.batch()
        has_existing = False
        for request in existing_requests:
          batch.delete(request.reference)
          has_existing = True
        if has_existing:
          batch.delete(change.document.reference)
          batch.update(db.collection(USER_COLLECTION).document(fromid), {
            "friends."+toid: u"",
            "pluggedIn."+toid: True
          })
          batch.update(db.collection(USER_COLLECTION).document(toid), {
            "friends."+fromid: u"",
            "pluggedIn."+fromid: True
          })
          batch.commit()


    except Exception as e:
      print(traceback.print_exc())

def watch_watch():
  for doc in db.collection(USER_COLLECTION).get():
    doc.reference.update({
      "inPrivate": False
    })

  user_watch = db.collection(USER_COLLECTION).on_snapshot(watch_users)
  room_watch = db.collection(ROOM_COLLECTION).on_snapshot(watch_rooms)
  friend_request_watch = db.collection(FRIEND_REQUEST_COLLECTION).on_snapshot(watch_friend_requests)
  while True:
    if user_watch._closed:
      user_watch = db.collection(USER_COLLECTION).on_snapshot(watch_users)
    if room_watch._closed:
      room_watch = db.collection(ROOM_COLLECTION).on_snapshot(watch_rooms)
    if friend_request_watch._closed:
      friend_request_watch = db.collection(FRIEND_REQUEST_COLLECTION).on_snapshot(watch_friend_requests)
    time.sleep(1)

watch_watch()
