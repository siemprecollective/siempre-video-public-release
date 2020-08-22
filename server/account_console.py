from cmd import Cmd
import firebase_admin
from firebase_admin import auth
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage

USER_COLLECTION = "users"

cred = credentials.Certificate("BLANK");
firebase_admin.initialize_app(cred, {
    'storageBucket': 'BLANK'
})
db = firestore.client()
bucket = storage.bucket()

class MyPrompt(Cmd):
    def do_list(self, args):
        for user in auth.list_users().iterate_all():
            try:
                doc = db.collection(USER_COLLECTION).document(user.uid).get()
                display_name = doc.to_dict()['name']
            except:
                display_name = ""
            line =  display_name + (" " * max(0,20-len(display_name)))
            line += user.email   + (" " * max(0,40-len(user.email)))
            line += user.uid
            print(line)

    def do_add_picture(self, args):
        split_args = args.split(" ")
        print(split_args)
        if not len(split_args) == 2:
            print("add_picture requires two args: userid, and picture path")
        else:
            storagePath = split_args[0] + "/profile"
            imageBlob = bucket.blob(storagePath)
            imageBlob.upload_from_filename(split_args[1])
            db.collection(USER_COLLECTION).document(split_args[0]).update({'profilePicturePath': unicode(storagePath)})

    def do_add_user(self, args):
        split_args = args.split(" ")
        print(split_args)
        if not len(split_args) == 3:
            print("add_user requires two args: email, password, and name")
        else:
            user = auth.create_user(
                email=split_args[0], password=split_args[1])
            data = {
                'friends': {},
                'inCall': {},
                'name': unicode(split_args[2]),
                'status': 2
            }
            db.collection(USER_COLLECTION).document(user.uid).set(data)
            print('Successfully created new user: {}'.format(user.uid))

    def do_add_friendship(self, args):
        split_args = args.split(" ")
        print(split_args)
        if not len(split_args) == 2:
            print("add_friendship requires two args: userid1, userid2")
        else:
            batch = db.batch()
            batch.update(db.collection(USER_COLLECTION).document(split_args[0]), {'friends.' + split_args[1]: u''})
            batch.update(db.collection(USER_COLLECTION).document(split_args[1]), {'friends.' + split_args[0]: u''})
            batch.update(db.collection(USER_COLLECTION).document(split_args[0]), {'inCall.' + split_args[1]: False})
            batch.update(db.collection(USER_COLLECTION).document(split_args[1]), {'inCall.' + split_args[0]: False})
            batch.update(db.collection(USER_COLLECTION).document(split_args[0]), {'pluggedIn.' + split_args[1]: True})
            batch.update(db.collection(USER_COLLECTION).document(split_args[1]), {'pluggedIn.' + split_args[0]: True})
            batch.commit()

    def do_remove_friendship(self, args):
        split_args = args.split(" ")
        print(split_args)
        if not len(split_args) == 2:
            print("remove_friendship requires two args: userid1, userid2")
        else:
            batch = db.batch()
            batch.update(db.collection(USER_COLLECTION).document(split_args[0]), {'friends.' + split_args[1]: firestore.DELETE_FIELD})
            batch.update(db.collection(USER_COLLECTION).document(split_args[1]), {'friends.' + split_args[0]: firestore.DELETE_FIELD})
            batch.update(db.collection(USER_COLLECTION).document(split_args[0]), {'inCall.' + split_args[1]: firestore.DELETE_FIELD})
            batch.update(db.collection(USER_COLLECTION).document(split_args[1]), {'inCall.' + split_args[0]: firestore.DELETE_FIELD})
            batch.update(db.collection(USER_COLLECTION).document(split_args[0]), {'pluggedIn.' + split_args[1]: firestore.DELETE_FIELD})
            batch.update(db.collection(USER_COLLECTION).document(split_args[1]), {'pluggedIn.' + split_args[0]: firestore.DELETE_FIELD})
            batch.commit()

    def do_help(self, args):
        print('no documentation lol. hopefully these are straightforward enough')
        print('list')
        print('add_user <email> <password> <name>')
        print('add_friendship <userid1> <userid2>')
        print('remove_friendship <userid1> <userid2>')
        print('add_picture <userid> <picture_path')
        print('quit')

    def do_quit(self, args):
        print("Quitting")
        raise SystemExit

if __name__ == '__main__':
    prompt = MyPrompt()
    prompt.prompt = '> '
    prompt.cmdloop('Starting prompt...')
