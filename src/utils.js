function getConversationId(id1, id2) {
  if (id1 < id2) {
    return id1 + "_" + id2;
  }
  return id2 + "_" + id1;
}

function generateId(length) {
   var result = '';
   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function isNightMode() {
  return document.body.classList.contains('night')
}

export { getConversationId, generateId, isNightMode };
