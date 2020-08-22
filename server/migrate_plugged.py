import firebase_admin
from firebase_admin import credentials 
from firebase_admin import firestore

USER_COLLECTION = "users"

cred = credentials.Certificate("BLANK");
firebase_admin.initialize_app(cred)
db = firestore.client()

if __name__ == '__main__':
    docs = db.collection(USER_COLLECTION).stream()
    for doc in docs:
        friends = doc.to_dict()['friends']
        for key in friends:
            friends[key] = True
        db.collection(USER_COLLECTION).document(doc.id).update({'pluggedIn': friends})
