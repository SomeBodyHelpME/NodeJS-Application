const db = require('./pool.js');

module.exports = {
  makeNewChatroomTable : async (...args) => {
    let ctrl_name = args[0];

    let createTableQuery = `
    CREATE TABLE IF NOT EXISTS chatroom.` + ctrl_name + ` (
      chat_idx INT(11) NOT NULL AUTO_INCREMENT,
      content TEXT NULL DEFAULT NULL,
      write_time VARCHAR(45) NULL DEFAULT NULL,
      count INT(11) NULL DEFAULT NULL,
      u_idx INT(11) NULL DEFAULT NULL,
      type INT(11) NULL DEFAULT NULL,
      PRIMARY KEY (chat_idx))
    ENGINE = InnoDB
    DEFAULT CHARACTER SET = utf8`;
    let createTable = await db.queryParamCnt_None(createTableQuery);
    console.log(createTable);
    return createTable;
  },
  makeNewEndpoint : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];

    let getUserInfoQuery = 'SELECT * FROM chatroom.endpoint WHERE u_idx = ? AND chatroom_idx = ?';
    let getUserInfo = await db.queryParamCnt_Arr(getUserInfoQuery, [u_idx, chatroom_idx]);
    if (getUserInfo.length !== 0) {
      return true;
    } else {
      let getChatroomCtrlNameQuery = 'SELECT ctrl_name FROM tkb.group_chatroom WHERE chatroom_idx = ?';
      let getChatroomCtrlName = await db.queryParamCnt_Arr(getChatroomCtrlNameQuery, [chatroom_idx]);

      let getLastIndexQuery = 'SELECT count(*) AS count FROM chatroom.' + getChatroomCtrlName[0].ctrl_name;
      let getLastIndex = await db.queryParamCnt_None(getLastIndexQuery);

      let insertNewEndpointQuery = 'INSERT INTO chatroom.endpoint (chatroom_idx, u_idx, value) VALUES (?, ?, ?)';
      let insertNewEndpoint = await db.queryParamCnt_Arr(insertNewEndpointQuery, [chatroom_idx, u_idx, getLastIndex[0].count]);

      if (!insertNewEndpoint) {
        return false;
      } else {
        return true;
      }
    }    
  },
  insertNewMessageInMainFunction : async (...args) => {
    let chatroom_idx = args[0];
    let content = args[1];
    let write_time = args[2];
    let u_idx = args[3];
    let type = args[4];
    let count = 0;

    let getChatroomCtrlNameQuery = 'SELECT ctrl_name FROM tkb.group_chatroom WHERE chatroom_idx = ?';
    let getChatroomCtrlName = await db.queryParamCnt_Arr(getChatroomCtrlNameQuery, [chatroom_idx]);

    if (!getChatroomCtrlName) {
      return false;
    } else {
      let insertMessageQuery = 'INSERT INTO chatroom.' + getChatroomCtrlName[0].ctrl_name + ' (u_idx, content, write_time, count, type) VALUES (?, ?, ?, ?, ?)';
      let insertMessage = await db.queryParamCnt_Arr(insertMessageQuery, [u_idx, content, write_time, count, type]);

      if (!insertMessage) {
        return false;
      } else {
        return insertMessage;
      }
    }
  },
  makingArraytoString : async (...args) => {
    var arr = args[0];

    var str = '';

    if (arr && arr.length > 0) {
      str = str + arr[0];
      for (let i = 1 ; i < arr.length ; i++) {
        str = str + '/' + arr[i];
        console.log(str);
      }
    }
    return str;
  }
};