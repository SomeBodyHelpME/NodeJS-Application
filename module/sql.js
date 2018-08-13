const async = require('async');
const moment = require('moment');
const schedule = require('node-schedule');

const pool = require('../config/dbPool.js');
const db = require('./pool.js');
const chat = require('./chat.js');
const statuscode = require('./statuscode.js');

// FCM
const FCM = require('fcm-node');
const serverKey = require('../config/serverKey').key;
const fcm = new FCM(serverKey);

/* groupName get */
// let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
// let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

/* Join 한 User 의 g_idx get */
// let findUserJoinedQuery = 'SELECT g_idx FROM tkb.joined WHERE u_idx = ?';
// let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);


module.exports = {
  makeNewGroup : async (...args) => {
    let u_idx = args[0];
    let real_name = args[1];
    let ctrl_name = args[2];
    let photo = args[3];

    let createGroupQuery = 'INSERT INTO tkb.group (real_name, ctrl_name, photo, default_chatroom_idx) VALUES (?, ?, ?, ?)';
    let createGroup = await db.queryParamCnt_Arr(createGroupQuery, [real_name, ctrl_name, photo, 0]);
    console.log(createGroup);
    let insertNewPersonGroupQuery = 'INSERT INTO tkb.group_joined (g_idx, u_idx) VALUES (?, ?)';
    let insertNewPersonGroup = await db.queryParamCnt_Arr(insertNewPersonGroupQuery, [createGroup.insertId, u_idx]);

    let createDefaultChatroomQuery = 'INSERT INTO tkb.group_chatroom (real_name, ctrl_name, photo, g_idx) VALUES (?, ?, ?, ?)';
    let createDefaultChatroom = await db.queryParamCnt_Arr(createDefaultChatroomQuery, [real_name, ctrl_name, photo, createGroup.insertId]);

    let createTable = await chat.makeNewChatroomTable(ctrl_name);

    // console.log(createDefaultChatroom);
    let g_idx = createGroup.insertId;
    let default_chatroom_idx = createDefaultChatroom.insertId;
    console.log(g_idx);
    console.log(default_chatroom_idx);
    let insertNewPersonChatroomQuery = 'INSERT INTO tkb.chatroom_joined (chatroom_idx, g_idx, u_idx) VALUES (?, ?, ?)';
    let insertNewPersonChatroom = await db.queryParamCnt_Arr(insertNewPersonChatroomQuery, [default_chatroom_idx, g_idx, u_idx]);

    let updateChatroomIndexToGroupQuery = 'UPDATE tkb.group SET default_chatroom_idx = ? WHERE g_idx = ?';
    let updateChatroomIndexToGroup = await db.queryParamCnt_Arr(updateChatroomIndexToGroupQuery, [default_chatroom_idx, g_idx]);

    let insertNewEndpoint = await chat.makeNewEndpoint(u_idx, default_chatroom_idx);
    // console.log(createDefaultChatroom);

    // console.log(updateChatroomIndexToGroup);
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
    let insertNewMessageResult = await chat.insertNewMessageInMainFunction(default_chatroom_idx, u_idx, write_time, u_idx, 9);

    let result = {
      "default_chatroom_idx" : createDefaultChatroom.insertId,
      "g_idx" : createGroup.insertId,
      "real_name" : real_name,
      "ctrl_name" : ctrl_name,
      "photo" : photo
    };

    if (!createGroup || !insertNewPersonGroup || !createDefaultChatroom || !insertNewPersonChatroom || !updateChatroomIndexToGroup || !insertNewMessageResult) {
      return false;
    } else {
      return result;
    }
  },
  makeNewChatroom : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let real_name = args[2];
    let ctrl_name = args[3];
    let photo = args[4];
    let userArray = args[5];
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");

    let flag = true;

    let createChatRoomQuery = 'INSERT INTO tkb.group_chatroom (real_name, ctrl_name, photo, g_idx) VALUES (?, ?, ?, ?)';
    let createChatRoom = await db.queryParamCnt_Arr(createChatRoomQuery, [real_name, ctrl_name, photo, g_idx]);

    let insertNewPersonQuery = 'INSERT INTO tkb.chatroom_joined (chatroom_idx, g_idx, u_idx) VALUES (?, ?, ?)';
    let insertNewPerson = await db.queryParamCnt_Arr(insertNewPersonQuery, [createChatRoom.insertId, g_idx, u_idx]);

    let createTable = await chat.makeNewChatroomTable(ctrl_name);
    let insertNewEndpoint = await chat.makeNewEndpoint(u_idx, createChatRoom.insertId);
     
    if (userArray) {
      let userArray2 = [];
      userArray2 = userArray.slice();
      var makingArraytoStringResult = await chat.makingArraytoString(userArray2.push(u_idx));
      var insertNewMessageResult = await chat.insertNewMessageInMainFunction(createChatRoom.insertId, makingArraytoStringResult, write_time, u_idx, 9);
      for (let i = 0 ; i < userArray.length ; i++) {
        let insertNewFriendQuery = 'INSERT INTO tkb.chatroom_joined (chatroom_idx, g_idx, u_idx) VALUES (?, ?, ?)';
        let insertNewFriend = await db.queryParamCnt_Arr(insertNewFriendQuery, [createChatRoom.insertId, g_idx, userArray[i]]);

        let insertNewEndpoint = await chat.makeNewEndpoint(userArray[i], createChatRoom.insertId);
     
        if (!insertNewFriend || !insertNewEndpoint) {
          flag = false;
          break;
        }
      }  
    }
    
    let result = {
      "chatroom_idx" : createChatRoom.insertId,
      "real_name" : real_name,
      "ctrl_name" : ctrl_name,
      "photo" : photo
    };
    if(!createChatRoom || !insertNewPerson || !insertNewMessageResult || !flag) {
      return false;
    } else {
      return result;
    }

  },
  joinNewPersonGroup : async (...args) => {
    let g_idx = args[0];
    let u_idx = args[1];

    // let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
    // var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);
    // let searchUserInfoQuery = 'SELECT * FROM tkb.user WHERE u_idx = ?';
    // var searchUserInfo = await db.queryParamCnt_Arr(searchUserInfoQuery, [u_idx]);

    let insertUserInfoQuery = 'INSERT INTO tkb.group_joined (u_idx, g_idx) VALUES (?, ?)';
    var insertUserInfo = await db.queryParamCnt_Arr(insertUserInfoQuery, [u_idx, g_idx]);

    let getDefaultChatroomIndexQuery = 'SELECT default_chatroom_idx FROM tkb.group WHERE g_idx = ?';
    let getDefaultChatroomIndex = await db.queryParamCnt_Arr(getDefaultChatroomIndexQuery, [g_idx]);

    let insertDefaultChatroomQuery = 'INSERT INTO tkb.chatroom_joined (u_idx, g_idx, chatroom_idx) VALUES (?, ?, ?)';
    let insertDefaultChatroom = await db.queryParamCnt_Arr(insertDefaultChatroomQuery, [u_idx, g_idx, getDefaultChatroomIndex[0].default_chatroom_idx]);
    
    let insertNewEndpoint = await chat.makeNewEndpoint(u_idx, getDefaultChatroomIndex[0].default_chatroom_idx);

    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
    let insertNewMessageResult = await chat.insertNewMessageInMainFunction(getDefaultChatroomIndex[0].default_chatroom_idx, u_idx, write_time, u_idx, 9);
    
    if(!insertUserInfo || !getDefaultChatroomIndex || !insertDefaultChatroom || !insertNewEndpoint || !insertNewMessageResult) {
      return false;
    } else {
      return true;
    }
  },// joinNewPersonGroup
  checkPerson : async (...args) => {
    let chatroom_idx = args[0];
    let g_idx = args[1];
    let userArray = args[2];

    let result = 2;

    if (userArray) {
      for (let i = 0 ; i < userArray.length ; i++) {
        let checkQuery = 'SELECT * FROM tkb.chatroom_joined WHERE chatroom_idx = ? AND g_idx = ? AND u_idx = ?';
        let checkResult = await db.queryParamCnt_Arr(checkQuery, [chatroom_idx, g_idx, userArray[i]]);

        if (!checkResult) {
          result = 0;
          break;
        } else if (checkResult.length === 1) {
          result = 1;
          break;
        } 
      }
    }
    
    return result;
  },
  joinNewPersonChatroom : async (...args) => {
    let chatroom_idx = args[0];
    let g_idx = args[1];
    let userArray = args[2];
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");

    // let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
    // var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);
    // let searchUserInfoQuery = 'SELECT * FROM tkb.user WHERE u_idx = ?';
    // var searchUserInfo = await db.queryParamCnt_Arr(searchUserInfoQuery, [u_idx]);

    if (userArray) {
      var makingArraytoStringResult = await chat.makingArraytoString(userArray);
      var insertNewMessageResult = await chat.insertNewMessageInMainFunction(chatroom_idx, makingArraytoStringResult, write_time, makingArraytoStringResult, 9);
      
      for (let i = 0 ; i < userArray.length ; i++) {
        let insertUserInfoQuery = 'INSERT INTO tkb.chatroom_joined (u_idx, g_idx, chatroom_idx) VALUES (?, ?, ?)';
        var insertUserInfo = await db.queryParamCnt_Arr(insertUserInfoQuery, [userArray[i], g_idx, chatroom_idx]);

        var insertNewEndpoint = await chat.makeNewEndpoint(userArray[i], chatroom_idx);

        // console.log(insertUserInfo);
        if (!insertUserInfo || !insertNewEndpoint) {
          break;
        }
      }
    }
    
    if(!insertUserInfo || !insertNewEndpoint || !insertNewMessageResult) {   //!searchGroupInfo || !searchUserInfo || 
      return false;
    } else {
      return true;
    }
  },// joinNewPersonChatroom
  // findAllGroupMemberAddr : async (...args) => {
  //   const u_idx = args[0];
  //   let findUserJoinedQuery = 'SELECT g_idx FROM tkb.joined WHERE u_idx = ?';
  //   var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
  //   let result = [];
  //   for(let i = 0 ; i < findUserJoined.length ; i++) {
  //     let findGroupNameQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
  //     var findGroupName = await db.queryParamCnt_Arr(findGroupNameQuery, [findUserJoined[i].g_idx]);
  //     let findUserIndexQuery = 'SELECT * FROM tkb.joined WHERE g_idx = ? AND u_idx != ?';
  //     var findUserIndex = await db.queryParamCnt_Arr(findUserIndexQuery, [findUserJoined[i].g_idx, u_idx]);
  //     let GroupArray = [];
  //     for(let j = 0 ; j < findUserIndex.length ; j++) {
  //       let findUserDetailInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM tkb.user WHERE u_idx = ?';
  //       var findUserDetailInfo = await db.queryParamCnt_Arr(findUserDetailInfoQuery, [findUserIndex[j].u_idx]);
  //       GroupArray.push(findUserDetailInfo[0]);
  //     }
  //     let GroupJson = {
  //       name : findGroupName,
  //       data : GroupArray
  //     };
  //     result.push(GroupJson);
  //   }

  //   return result;

  // },
  // 미처리 항목 보여주는 뷰(그룹별로 보여줄 때)
  findRestGroupThings : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT * FROM tkb.chatroom_joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 공지 밀린 것
    let NoticesArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupArray1 = [];
      
      let findNoticeIndexQuery = 'SELECT * FROM tkb.notice WHERE chatroom_idx = ?';
      var findNoticeIndex = await db.queryParamCnt_Arr(findNoticeIndexQuery, [findUserJoined[i].chatroom_idx]);
      for(let j = 0 ; j < findNoticeIndex.length ; j++) {
        let findNoticeQuery = 'SELECT * FROM tkb.notice_response WHERE notice_idx = ? AND status = ? AND u_idx = ?';
        var findNotice = await db.queryParamCnt_Arr(findNoticeQuery, [findNoticeIndex[j].notice_idx, 0, u_idx]);
        if(findNotice.length != 0) {
          let AgendaJson = findNoticeIndex[j];
          AgendaJson.g_idx = findUserJoined[i].g_idx;
          AgendaJson.chatroom_idx = findUserJoined[i].chatroom_idx;
          GroupArray1.push(AgendaJson);
        }
      }
      if(GroupArray1.length != 0) {
        NoticesArray = NoticesArray.concat(GroupArray1);
      }
    }
    
    NoticesArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    // 신호등 밀린 것
    let LightsArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupArray2 = [];
      
      let findLightsIndexQuery = 'SELECT tkb.lights.* FROM tkb.lights WHERE chatroom_idx = ?';
      var findLightsIndex = await db.queryParamCnt_Arr(findLightsIndexQuery, [findUserJoined[i].chatroom_idx]);
      for(let j = 0 ; j < findLightsIndex.length ; j++) {
        let findLightsQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ? AND color = ? AND u_idx = ?';
        var findLights = await db.queryParamCnt_Arr(findLightsQuery, [findLightsIndex[j].light_idx, "r", u_idx]); // 색깔 : r y g
        if(findLights.length != 0) {
          let AgendaJson = findLightsIndex[j];
          AgendaJson.g_idx = findUserJoined[i].g_idx;
          AgendaJson.chatroom_idx = findUserJoined[i].chatroom_idx;
          GroupArray2.push(AgendaJson);
        }
      }// for(let j = 0)
      if(GroupArray2.length != 0) {
        LightsArray = LightsArray.concat(GroupArray2);
      }
    }// for(let i = 0)

    LightsArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    //투표 밀린 것
    let VotesArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupArray3 = [];
      
      let findVotesIndexQuery = 'SELECT * FROM tkb.vote WHERE chatroom_idx = ?';
      var findVotesIndex = await db.queryParamCnt_Arr(findVotesIndexQuery, [findUserJoined[i].chatroom_idx]);
      for(let j = 0 ; j < findVotesIndex.length ; j++) {
        let findVotesQuery = 'SELECT * FROM tkb.vote_response WHERE vote_idx = ? AND status = ? AND u_idx = ?';
        var findVotes = await db.queryParamCnt_Arr(findVotesQuery, [findVotesIndex[j].vote_idx, 0, u_idx]); // 미응답은 : w, 응답은 : a
        if(findVotes.length != 0) {
          let AgendaJson = findVotesIndex[j];
          AgendaJson.g_idx = findUserJoined[i].g_idx;
          AgendaJson.chatroom_idx = findUserJoined[i].chatroom_idx;
          GroupArray3.push(AgendaJson);
        }
      }// for(let j = 0)
      if(GroupArray3.length != 0) {
        VotesArray = VotesArray.concat(GroupArray3);
      }
    }// for(let i = 0)

    VotesArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    let result = {
      notices : NoticesArray,
      lights : LightsArray,
      votes : VotesArray
    };

    return result;

  },// findRestGroupThings(그룹별로 보여줄 때)
  // groupNotice : async (...args) => {
  //   let u_idx = args[0];
  //   let g_idx = args[1];
  //   let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
  //   var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);
  //   let result = [];
  //   for(let i = 0 ; i < findUserJoined.length ; i++) {
  //     let findEachGroupNoticeQuery = 'SELECT tkb.notice.*, tkb.notice_response.status AS response_status FROM tkb.notice JOIN tkb.notice_response USING(notice_idx) WHERE chatroom_idx = ? ORDER BY tkb.notice.notice_idx DESC';
  //     var findEachGroupNotice = await db.queryParamCnt_Arr(findEachGroupNoticeQuery, [findUserJoined[i].chatroom_idx]);

  //     if(findEachGroupNotice === undefined) {
  //       break;
  //     }
  //     // if(findEachGroupNotice.length != 0) {  //이 부분은 공지가 없을 시 그룹 이름이 보이지 않는 경우, 현재는 공지가 없어도 그룹이름이 보임
  //       result.push(
  //         {
  //           chatroom_idx : findUserJoined[i].chatroom_idx,
  //           data : findEachGroupNotice
  //         }
  //       );

  //     // }
  //   }
  //   if(!findUserJoined || ! findEachGroupNotice) {
  //     return false;
  //   } else {
  //     return result;
  //   }
  // },
  groupNotice : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findEachGroupNoticeQuery = 'SELECT tkb.notice.*, tkb.notice_response.status AS response_status FROM tkb.notice JOIN tkb.notice_response USING(notice_idx) WHERE chatroom_idx = ? AND tkb.notice_response.u_idx = ? ORDER BY tkb.notice.notice_idx DESC';
      var findEachGroupNotice = await db.queryParamCnt_Arr(findEachGroupNoticeQuery, [findUserJoined[i].chatroom_idx, u_idx]);
      console.log(findEachGroupNotice);
      if(findEachGroupNotice === undefined) {
        break;
      }
      
      result = result.concat(findEachGroupNotice);  
    }

    result.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    if(!findUserJoined || ! findEachGroupNotice) {
      return false;
    } else {
      return result;
    }
  },
  groupLightsReceiver : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);
    console.log(findUserJoined);
    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      
      let findEachGroupLightsQuery =
      `SELECT tkb.lights.*, tkb.light_response.color FROM tkb.light_response JOIN tkb.lights USING(light_idx)
      WHERE chatroom_idx = ? AND tkb.light_response.u_idx = ? AND tkb.lights.u_idx != ? ORDER BY tkb.lights.light_idx DESC`;
      var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx]);
      if(findEachGroupLights === undefined) {
        break;
      }
      
      resArray = resArray.concat(findEachGroupLights);
    }

    resArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    if(!findUserJoined || !findEachGroupLights) {
      return false;
    } else {
      return resArray;
    }
  },
  groupLightsSender : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ? ';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);

    // 발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      
      let findEachGroupLightsQuery = 'SELECT * FROM tkb.lights WHERE chatroom_idx = ? AND u_idx = ? ORDER BY tkb.lights.light_idx DESC';
      var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].chatroom_idx, u_idx]);

      if(findEachGroupLights === undefined) {
        break;
      }
      
      reqArray = reqArray.concat(findEachGroupLights);
    }

    reqArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    if(!findUserJoined || !findEachGroupLights) {
      return false;
    } else {
      return reqArray;
    }
  },
  // homePick : async (...args) => {
  //   let u_idx = args[0];
  //   let findUserJoinedQuery = 'SELECT g_idx FROM tkb.joined WHERE u_idx = ?';
  //   var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
  //   let result = [];
  //   for(let i = 0 ; i < findUserJoined.length ; i++) {
  //     let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
  //     var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

  //     let findEachGroupPickQuery =
  //     `SELECT tkb.pick.* , tkb.user.photo, tkb.user.name, tkb.user.id
  //     FROM tkb.pick, tkb.user WHERE tkb.pick.write_id = tkb.user.id
  //     AND tkb.pick.u_idx = ? AND tkb.pick.g_idx= ? ORDER BY write_time DESC`;
  //     var findEachGroupPick = await db.queryParamCnt_Arr(findEachGroupPickQuery, [u_idx, findUserJoined[i].g_idx]);

  //     if(searchGroupInfo === undefined || findEachGroupPick === undefined) {
  //       break;
  //     }
  //     result.push(
  //       {
  //         name : searchGroupInfo[0],
  //         data : findEachGroupPick
  //       }
  //     );
  //   }
  //   if(!findUserJoined || !searchGroupInfo || !findEachGroupPick) {
  //     return false;
  //   } else {
  //     return result;
  //   }
  // },
  groupVoteReceiver : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);

    // 수신자에 대한 내용
    let NotFinishedArray = [];
    let FinishedArray = [];

    for (let i = 0 ; i < findUserJoined.length ; i++) {
      // let GroupJson = {};
      
      // let findEachGroupVoteQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx)
      // WHERE tkb.vote.chatroom_idx = ? AND tkb.vote.u_idx != ? AND tkb.vote_response.u_idx = ? ORDER BY tkb.vote.vote_idx DESC`;
      // let findEachGroupVote = await db.queryParamCnt_Arr(findEachGroupVoteQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx]);
      // GroupJson.chatroom_idx = findUserJoined[i].chatroom_idx;
      // GroupJson.data = findEachGroupVote;
      let findEachGroupVoteNotFinishedQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx)
      WHERE tkb.vote.chatroom_idx = ? AND tkb.vote.u_idx != ? AND tkb.vote_response.u_idx = ? AND tkb.vote.status = ? ORDER BY tkb.vote.vote_idx DESC`;
      var findEachGroupVoteNotFinished = await db.queryParamCnt_Arr(findEachGroupVoteNotFinishedQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx, 0]);

      let findEachGroupVoteFinishedQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx)
      WHERE tkb.vote.chatroom_idx = ? AND tkb.vote.u_idx != ? AND tkb.vote_response.u_idx = ? AND tkb.vote.status = ? ORDER BY tkb.vote.vote_idx DESC`;
      var findEachGroupVoteFinished = await db.queryParamCnt_Arr(findEachGroupVoteFinishedQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx, 1]);

      if(findEachGroupVoteNotFinished === undefined || findEachGroupVoteFinished === undefined) {
        break;
      }
      // GroupJson.chatroom_idx = findUserJoined[i].chatroom_idx;
      // GroupJson.data = {
      //   NotFinished : findEachGroupVoteNotFinished,
      //   Finished : findEachGroupVoteFinished
      // };
      // receiverArray.push(GroupJson);

      NotFinishedArray = NotFinishedArray.concat(findEachGroupVoteNotFinished);
      FinishedArray = FinishedArray.concat(findEachGroupVoteFinished);
    }

    NotFinishedArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    FinishedArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    if (!findUserJoined) {
      return false;
    } else {
      return {
        NotFinished : NotFinishedArray,
        Finished : FinishedArray
      };
    }
  },
  groupVoteSender : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);

    //발신자에 대한 내용
    // let senderArray = [];
    let NotFinishedArray = [];
    let FinishedArray = [];

    for (let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      
      // let findEachGroupVoteQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx)
      // WHERE tkb.vote.chatroom_idx = ? AND tkb.vote.u_idx = ? AND tkb.vote_response.u_idx = ? ORDER BY tkb.vote.vote_idx DESC`;
      // let findEachGroupVote = await db.queryParamCnt_Arr(findEachGroupVoteQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx]);
      // GroupJson.chatroom_idx = findUserJoined[i].chatroom_idx;
      // GroupJson.data = findEachGroupVote;
      let findEachGroupVoteNotFinishedQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx)
      WHERE tkb.vote.chatroom_idx = ? AND tkb.vote.u_idx = ? AND tkb.vote_response.u_idx = ? AND tkb.vote.status = ? ORDER BY tkb.vote.vote_idx DESC`;
      var findEachGroupVoteNotFinished = await db.queryParamCnt_Arr(findEachGroupVoteNotFinishedQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx, 0]);

      let findEachGroupVoteFinishedQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx)
      WHERE tkb.vote.chatroom_idx = ? AND tkb.vote.u_idx = ? AND tkb.vote_response.u_idx = ? AND tkb.vote.status = ? ORDER BY tkb.vote.vote_idx DESC`;
      var findEachGroupVoteFinished = await db.queryParamCnt_Arr(findEachGroupVoteFinishedQuery, [findUserJoined[i].chatroom_idx, u_idx, u_idx, 1]);

      if(findEachGroupVoteNotFinished === undefined || findEachGroupVoteFinished === undefined) {
        break;
      }
      // GroupJson.chatroom_idx = findUserJoined[i].chatroom_idx;
      // GroupJson.data = {
      //   NotFinished : findEachGroupVoteNotFinished,
      //   Finished : findEachGroupVoteFinished
      // };
      // senderArray.push(GroupJson);
     
      NotFinishedArray = NotFinishedArray.concat(findEachGroupVoteNotFinished);
      FinishedArray = FinishedArray.concat(findEachGroupVoteFinished);
    }

    NotFinishedArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });

    FinishedArray.sort(function(a, b) {      // descending order
      return a.write_time > b.write_time ? -1 : a.write_time < b.write_time ? 1 : 0;
    });


    if (!findUserJoined) {
      return false;
    } else {
      return {
        NotFinished : NotFinishedArray,
        Finished : FinishedArray
      };
    }
  },
  forEachNotice : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];
    
    //let showAllNoticeQuery = 'SELECT * FROM tkb.group JOIN tkb.notice USING(chatroom_idx) WHERE chatroom_idx = ? ORDER BY write_time';  //이름 같이 전송해야 할 때
    let showAllNoticeQuery = 'SELECT tkb.notice.*, tkb.notice_response.status AS response_status FROM tkb.notice JOIN tkb.notice_response USING(notice_idx) WHERE chatroom_idx = ? AND tkb.notice_response.u_idx = ? ORDER BY notice_idx DESC';
    var showAllNotice = await db.queryParamCnt_Arr(showAllNoticeQuery, [chatroom_idx, u_idx]);
    if(!showAllNotice) {
      return false;
    } else {
      return showAllNotice;
    }
  },// forEachNotice
  forEachLights : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];

    let findEachGroupLightsQuery =
    `SELECT tkb.lights.*, tkb.light_response.color FROM tkb.light_response JOIN tkb.lights USING(light_idx)
    WHERE chatroom_idx = ? AND tkb.light_response.u_idx = ? ORDER BY tkb.lights.light_idx DESC`;
    var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [chatroom_idx, u_idx]);

    if(!findEachGroupLights) {
      return false;
    } else {
      return findEachGroupLights;
    }
  },// forEachLights
  forEachLightsStatus : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];
    let light_idx = args[2];

    let findEachGroupLightsStatusQuery = 'SELECT u_idx FROM tkb.lights WHERE chatroom_idx = ? AND light_idx = ?';
    var findEachGroupLightsStatus = await db.queryParamCnt_Arr(findEachGroupLightsStatusQuery, [chatroom_idx, light_idx]);

    if(u_idx === findEachGroupLightsStatus[0].u_idx) {
      return true;
    } else {
      return false;
    }
  },
  forEachLightsResponse : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];
    let light_idx = args[2];
    let color = args[3];
    let result;

    let findEachGroupLightsResQuery = 'SELECT * FROM tkb.lights WHERE chatroom_idx = ? AND light_idx = ?';
    var findEachGroupLightsRes = await db.queryParamCnt_Arr(findEachGroupLightsResQuery, [chatroom_idx, light_idx]);

    if(findEachGroupLightsRes[0].open_status === 1) {  //true check
      let findEachGroupLightsResAllQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ? AND color = ?';
      var findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [light_idx, color]);

      result = findEachGroupLightsResAll;
    } else {
      let findEachGroupLightsResAloneQuery = 'SELECT * FROM tkb.light_response WHERE u_idx = ? AND light_idx = ? AND color = ?';
      var findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [u_idx, light_idx, color]);

      result = findEachGroupLightsResAlone;
    }

    if(!findEachGroupLightsRes) {
      return false;
    } else {
      return result;
    }
  },//forEachLightsResponse
  // forEachPick : async (...args) => {
  //   let u_idx = args[0];
  //   let g_idx = args[1];
  //   let showAllPickQuery =
  //   `SELECT tkb.pick.*, tkb.user.photo, tkb.user.name, tkb.user.id
  //   FROM tkb.pick, tkb.user WHERE tkb.pick.write_id = tkb.user.id
  //   AND tkb.pick.u_idx = ? AND tkb.pick.g_idx = ?
  //   ORDER BY write_time DESC`;
  //   var showAllPick = await db.queryParamCnt_Arr(showAllPickQuery, [u_idx, g_idx]);

  //   if(!showAllPick) {
  //     return false;
  //   } else {
  //     return showAllPick;
  //   }
  // },// forEachPick
  forEachVote : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];

    // let showAllVoteQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx) 
    // WHERE tkb.vote.chatroom_idx = ? AND tkb.vote_response.u_idx = ? ORDER BY tkb.vote.vote_idx DESC`;
    // let showAllVote = await db.queryParamCnt_Arr(showAllVoteQuery, [chatroom_idx, u_idx]);

    // if (!showAllVote) {
    //   return false;
    // } else {
    //   return showAllVote;
    // }
    let showAllVoteNotFinishedQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx) 
    WHERE tkb.vote.chatroom_idx = ? AND tkb.vote_response.u_idx = ? AND tkb.vote.status = ? ORDER BY tkb.vote.vote_idx DESC`;
    var showAllVoteNotFinished = await db.queryParamCnt_Arr(showAllVoteNotFinishedQuery, [chatroom_idx, u_idx, 0]);

    let showAllVoteFinishedQuery = `SELECT tkb.vote.*, tkb.vote_response.status AS response_status, tkb.vote_response.value AS response_value FROM tkb.vote_response JOIN tkb.vote USING(vote_idx) 
    WHERE tkb.vote.chatroom_idx = ? AND tkb.vote_response.u_idx = ? AND tkb.vote.status = ? ORDER BY tkb.vote.vote_idx DESC`;
    var showAllVoteFinished = await db.queryParamCnt_Arr(showAllVoteFinishedQuery, [chatroom_idx, u_idx, 1]);

    if(!showAllVoteNotFinished || !showAllVoteFinished) {
      return false;
    } else {
      return {
        NotFinished : showAllVoteNotFinished,
        Finished : showAllVoteFinished
      };
    }
  },// forEachVote
  forEachVoteOne : async (...args) => {
    let vote_idx = args[0];

    let getOneVoteInformationQuery = 'SELECT * FROM tkb.vote WHERE vote_idx = ?';
    var getOneVoteInformation = await db.queryParamCnt_Arr(getOneVoteInformationQuery, [vote_idx]);

    if(!getOneVoteInformation) {
      return false;
    } else {
      return getOneVoteInformation[0];
    }
  },
  forEachVoteChoice : async (...args) => {
    let vote_idx = args[0];

    let getAllChoiceforEachVoteQuery = 'SELECT * FROM tkb.vote_content WHERE tkb.vote_content.vote_idx = ? ORDER BY tkb.vote_content.vote_content_idx';
    var getAllChoiceforEachVote = await db.queryParamCnt_Arr(getAllChoiceforEachVoteQuery, [vote_idx]);

    if(!getAllChoiceforEachVote) {
      return false;
    } else {
      for (let i = 0 ; i < getAllChoiceforEachVote.length ; i++) {
        getAllChoiceforEachVote[i].userArray = [];
      }
      return getAllChoiceforEachVote;
    }
  },// forEachVoteExample
  forEachVoteResponse : async (...args) => {
    let vote_idx = args[0];

    let findEachGroupVoteResAllQuery = 'SELECT * FROM tkb.vote_response WHERE vote_idx = ?';
    var findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [vote_idx]);

    return findEachGroupVoteResAll;
  },// forEachVoteResponse
  forEachVoteCombine : async (...args) => {
    let choiceresult = args[0];
    let responseresult = args[1];
    console.log(choiceresult);
    console.log(responseresult);
    for (let i = 0 ; i < responseresult.length ; i++) {
      if (!responseresult[i].value) {
        continue;
      }
      for(let j = 0 ; j < choiceresult.length ; j++) {
        if (choiceresult[j].vote_content_idx === responseresult[i].value) {
          if (choiceresult[j].userArray) {
            choiceresult[j].userArray.push(responseresult[i].u_idx);
          }
        }
      }
      // choiceresult[responseresult[i].value].userArray.append(responseresult[i].u_idx);
    }
    return choiceresult;
  },
  makeNotice : async (...args) => {
    let u_idx = args[0];
    let chat_idx = args[1];
    let chatroom_idx = args[2];
    let write_time = args[3];
    let content = args[4];

    // let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE chatroom_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [chatroom_idx]);

    let insertNoticeQuery = 'INSERT INTO tkb.notice (u_idx, chat_idx, chatroom_idx, write_time, content) VALUES (?, ?, ?, ?, ?)';
    var insertNotice = await db.queryParamCnt_Arr(insertNoticeQuery, [u_idx, chat_idx, chatroom_idx, write_time, content]);
    console.log(u_idx);
    console.log(chat_idx);
    console.log(chatroom_idx);
    console.log(write_time);
    console.log(content);
    
    let insertNoticeResponseQuery = 'INSERT INTO tkb.notice_response (notice_idx, u_idx, status) VALUES (?, ?, ?)';
    var insertNoticeResponse = await db.queryParamCnt_Arr(insertNoticeResponseQuery, [insertNotice.insertId, u_idx, 1]);

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM tkb.chatroom_joined WHERE chatroom_idx = ? AND u_idx != ?';
    var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [chatroom_idx, u_idx]);

    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertNoticeResponseQuery = 'INSERT INTO tkb.notice_response (notice_idx, u_idx, status) VALUES (?, ?, ?)';
      var insertNoticeResponse = await db.queryParamCnt_Arr(insertNoticeResponseQuery, [insertNotice.insertId, searchAllUsersInSpecificGroup[i].u_idx, 0]);
      if (!insertNoticeResponse) {
        break;
      }
    }
    if(!insertNotice || !searchAllUsersInSpecificGroup || !insertNoticeResponse) {
      return false;
    } else {
      let insertNewMessageResult = await chat.insertNewMessageInMainFunction(chatroom_idx, insertNotice.insertId + '/' + content, write_time, u_idx, 5);
      if (!insertNewMessageResult) {
        return false;
      } else {
        return [insertNotice.insertId, insertNewMessageResult];
      }
    }
  },
  makeLights : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];
    let open_status = args[2];
    let entire_status = args[3];
    let content = args[4];
    // 이것은 피엠찡과 얘기해보자
    let write_time = args[5];
    let chat_idx = args[6];
    let userArray = args[7];        // select 문을 한 결과가 넘어와야 함

    // let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE chatroom_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [chatroom_idx]);

    let insertLightsQuery = 'INSERT INTO tkb.lights (u_idx, chatroom_idx, open_status, entire_status, content, write_time, chat_idx) VALUES (?, ?, ?, ?, ?, ?, ?)';
    var insertLights = await db.queryParamCnt_Arr(insertLightsQuery, [u_idx, chatroom_idx, open_status, entire_status, content, write_time, chat_idx]);
    console.log('insertLights',insertLights);
    if(entire_status == 1) {
//      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM tkb.joined WHERE chatroom_idx = ? AND u_idx != ?';
      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM tkb.chatroom_joined WHERE chatroom_idx = ?';
      var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [chatroom_idx, u_idx]);
      console.log('searchAllUsersInSpecificGroup',searchAllUsersInSpecificGroup);
      for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
        if(searchAllUsersInSpecificGroup[i].u_idx === u_idx) {
          let insertLightsResponseQuery = 'INSERT INTO tkb.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
          var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, searchAllUsersInSpecificGroup[i].u_idx, "a", null, null]);
          console.log('insertLightsResponse',insertLightsResponse);
        } else {
          let insertLightsResponseQuery = 'INSERT INTO tkb.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
          var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, searchAllUsersInSpecificGroup[i].u_idx, "r", null, null]);
          console.log('insertLightsResponse',insertLightsResponse);
        }
      }
    } else {
      let insertLightsResponseMakerQuery = 'INSERT INTO tkb.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
      var insertLightsResponseMaker = await db.queryParamCnt_Arr(insertLightsResponseMakerQuery, [insertLights.insertId, u_idx, "a", null, null]);
      for(let j = 0 ; j < userArray.length ; j++) {
        console.log(userArray[j]);
        let insertLightsResponseQuery = 'INSERT INTO tkb.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
        var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, userArray[j], "r", null, null]);
        console.log('insertLightsResponse',insertLightsResponse);
      }
    }
    if(!insertLights) {
      return false;
    } else {
      let insertNewMessageResult = await chat.insertNewMessageInMainFunction(chatroom_idx, insertLights.insertId + '/' + content, write_time, u_idx, 6);

      if (!insertNewMessageResult) {
        return false;
      } else {
        return [insertLights.insertId, insertNewMessageResult];
      }
    }
  },
  // makePick : async (...args) => {
  //   let u_idx = args[0];
  //   let write_id = args[1];
  //   let chat_idx = args[2];
  //   let g_idx = args[3];
  //   let write_time = args[4];
  //   let content = args[5];

  //   // let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
  //   // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

  //   let insertPickQuery = 'INSERT INTO tkb.pick (u_idx, write_id, chat_idx, g_idx, write_time, content) VALUES (?, ?, ?, ?, ?, ?)';
  //   var insertPick = await db.queryParamCnt_Arr(insertPickQuery, [u_idx, write_id, chat_idx, g_idx, write_time, content]);
  //   if(!insertPick) {
  //     return false;
  //   } else {
  //     return true;
  //   }
  // },
  makeVote : async (...args) => {
    let u_idx = args[0];
    let chat_idx = args[1];
    let chatroom_idx = args[2];

    let write_time = args[3];
    let title = args[4];
    let content = args[5];
    let choice = args[6];  //배열의 형태로 넘어옴 ex) ['신촌', '이대', '시청']
    let endtime = args[7];

    // let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE chatroom_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [chatroom_idx]);

    let insertVoteQuery = 'INSERT INTO tkb.vote (u_idx, chat_idx, chatroom_idx, write_time, title, content, endtime) VALUES (?, ?, ?, ?, ?, ?, ?)';
    var insertVote = await db.queryParamCnt_Arr(insertVoteQuery, [u_idx, chat_idx, chatroom_idx, write_time, title, content, endtime]);

    for(let i = 0 ; i < choice.length ; i++) {
      let insertVoteContentQuery = 'INSERT INTO tkb.vote_content (vote_idx, content) VALUES (?, ?)';
      var insertVoteContent = await db.queryParamCnt_Arr(insertVoteContentQuery, [insertVote.insertId, choice[i]]);
    }

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM tkb.chatroom_joined WHERE chatroom_idx = ?';
    var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [chatroom_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertVoteResponseQuery = 'INSERT INTO tkb.vote_response (vote_idx, u_idx, status, value, write_time, chatroom_idx) VALUES (?, ?, ?, ?, ?, ?)';
      var insertVoteResponse = await db.queryParamCnt_Arr(insertVoteResponseQuery, [insertVote.insertId, searchAllUsersInSpecificGroup[i].u_idx, 0, null, null, chatroom_idx]);
    }

    // time modification 2018-01-01 01:01:01
    let year = endtime.substring(0, 4);
    let month = endtime.substring(5, 7);
    let day = endtime.substring(8, 10);
    let hour = endtime.substring(11, 13);
    let minute = endtime.substring(14, 16);
    let second = endtime.substring(17);
    let date = new Date(year, month-1, day, hour, minute, second);
    console.log(date);
    var j = schedule.scheduleJob(date, async function() {
      var voteCloseQuery = 'UPDATE tkb.vote SET status = ? WHERE vote_idx = ?';
      var voteCloseResult = await db.queryParamCnt_Arr(voteCloseQuery, [1, insertVote.insertId]);
    });


    if(!insertVote || !searchAllUsersInSpecificGroup) {
      return false;
    } else {
      let insertNewMessageResult = await chat.insertNewMessageInMainFunction(chatroom_idx, insertVote.insertId + '/' + title, write_time, u_idx, 7);

      if (!insertNewMessageResult) {
        return false;
      } else {
        return [insertVote.insertId, insertNewMessageResult];
      }
    }
  },
  modifyVote : async (...args) => {
    let u_idx = args[0];
    let vote_idx = args[1];
    let choice = args[2];

    let checkWriterQuery = 'SELECT u_idx FROM tkb.vote WHERE vote_idx = ? AND u_idx = ?';
    var checkWriter = await db.queryParamCnt_Arr(checkWriterQuery, [vote_idx, u_idx]);

    if(checkWriter.length === 1) {
      let deleteAllContentQuery = 'DELETE FROM tkb.vote_content WHERE vote_idx = ?';
      var deleteAllContent = await db.queryParamCnt_Arr(deleteAllContentQuery, [vote_idx]);

      for(let i = 0 ; i < choice.length ; i++) {
        let insertVoteContentQuery = 'INSERT INTO tkb.vote_content (vote_idx, vote_content_idx, content) VALUES (?, ?, ?)';
        var insertVoteContent = await db.queryParamCnt_Arr(insertVoteContentQuery, [vote_idx, i, choice[i]]);
      }
      return true;
    } else {
      return false;
    }
  },
  showSingleNoticeDetail : async (...args) => {
    let notice_idx = args[0];

    let getSingleNoticeQuery = 'SELECT tkb.notice.*, tkb.notice_response.status AS response_status FROM tkb.notice JOIN tkb.notice_response USING(notice_idx) WHERE notice_idx = ?';
    let getSingleNotice = await db.queryParamCnt_Arr(getSingleNoticeQuery, [notice_idx]);

    if (!getSingleNotice) {
      return false;
    } else {
      return getSingleNotice;
    }
  },
  showSingleLightsContent : async (...args) => {
    let light_idx = args[0];
    let u_idx = args[1];

    let getLightsInfoQuery = 'SELECT * FROM tkb.lights WHERE light_idx = ?';
    let getLightsInfo = await db.queryParamCnt_Arr(getLightsInfoQuery, [light_idx]);

    if (getLightsInfo[0].u_idx === u_idx) {   //작성자
      getLightsInfo[0].response_color = 'a';
      getLightsInfo[0].response_content = null;
    } else {
      let getLightsResponseOneUserQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ? AND u_idx = ?'; 
      let getLightsResponseOneUser = await db.queryParamCnt_Arr(getLightsResponseOneUserQuery, [light_idx, u_idx]);
      
      getLightsInfo[0].response_color = getLightsResponseOneUser[0].color;
      getLightsInfo[0].response_content = getLightsResponseOneUser[0].content;
    }
    
    if (!getLightsInfo) {
      return false;
    } else {
      return getLightsInfo[0];
    }
  },
  // showSingleLightsDetail : async (...args) => {
  //   let light_idx = args[0];
  //   let u_idx = args[1];

  //   let getLightsInfoQuery = 'SELECT * FROM tkb.lights WHERE light_idx = ?';
  //   let getLightsInfo = await db.queryParamCnt_Arr(getLightsInfoQuery, [light_idx]);

  //   var result = {};
  //   if (getLightsInfo[0].u_idx === u_idx) {   //작성자
  //     let getLightsResponseQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ?';
  //     let getLightsResponse = await db.queryParamCnt_Arr(getLightsResponseQuery, [light_idx]);

  //     result.lights = getLightsInfo[0];
  //     result.response = getLightsResponse;
  //     result.message = '';

  //   } else {
  //     if (getLightsInfo[0].open_status === 0) {
  //       let getLightsResponseOneUserQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ? AND u_idx = ?'; 
  //       let getLightsResponseOneUser = await db.queryParamCnt_Arr(getLightsResponseOneUserQuery, [light_idx, u_idx]);
        
  //       if (getLightsResponseOneUser.length === 0) {
  //         result.lights = getLightsInfo[0];
  //         result.response = [];
  //         result.message = '';

  //       } else if (getLightsResponseOneUser[0].color === 'g') {
  //         let getLightsResponseQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ?';
  //         let getLightsResponse = await db.queryParamCnt_Arr(getLightsResponseQuery, [light_idx]);

  //         result.lights = getLightsInfo[0];
  //         result.response = getLightsResponse;
  //         result.message = '';

  //       } else if (getLightsResponseOneUser[0].color === 'y') {
  //         result.lights = getLightsInfo[0];
  //         result.response = getLightsResponseOneUser;
  //         result.message = '';

  //       } else if (getLightsResponseOneUser[0].color === 'r') {
  //         result.lights = getLightsInfo[0];
  //         result.response = [];
  //         result.message = ''; 

  //       }
  //     } else {
  //       let getLightsResponseOneUserQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ? AND u_idx = ?'; 
  //       let getLightsResponseOneUser = await db.queryParamCnt_Arr(getLightsResponseOneUserQuery, [light_idx, u_idx]);

  //       result.lights = getLightsInfo[0];
  //       result.response = getLightsResponseOneUser;
  //       result.message = '';
  //     }



  //     // let checkColorQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ? AND u_idx = ?'; 
  //     // let checkColor = await db.queryParamCnt_Arr(checkColorQuery, [light_idx, u_idx]);
      
  //     // if (checkColor[0].color === 'g') {
  //     //   let getLightsResponseQuery = 'SELECT * FROM tkb.light_response WHERE light_idx = ?';
  //     //   let getLightsResponse = await db.queryParamCnt_Arr(getLightsResponseQuery, [light_idx]);

  //     //   result.lights = getLightsInfo[0];
  //     //   result.response = getLightsResponse;

  //     // } else if (checkColor[0].color === 'y') {
  //     //   result.lights = getLightsInfo[0];
  //     //   result.response = checkColor;

  //     // } else {      //checkColor[0].color === 'r'
  //     //   result.lights = getLightsInfo[0];
  //     //   result.response = [];
  //     // }

  //   }
    
    
    
  //   return true;
  // },
  fcmSendWhenMakeThings : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];
    let status = args[2];
    let index = args[3];
    let chat_idx = args[4];
    var flag = true;

    let getUsersListInGroupQuery = 'SELECT u_idx FROM tkb.chatroom_joined WHERE chatroom_idx = ? AND u_idx != ?';
    var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [chatroom_idx, u_idx]);

    if (getUsersListInGroup) {
      for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
        let getUsersTokenQuery = 'SELECT token FROM tkb.user WHERE u_idx = ?';
        var getUsersToken = await db.queryParamCnt_Arr(getUsersTokenQuery, [getUsersListInGroup[i].u_idx]);
        
        if (getUsersToken) {
          let client_token = getUsersToken[0].token;


          var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
              to: client_token,
              data: {
                status : status,
                chatroom_idx : chatroom_idx,
                index : index,
                chat_idx : chat_idx
              },
              priority: "high",
              content_available: true
          };

          message.data.title = '팀플의 요정';   //제목
          if (status === statuscode.makeNotice) {
            message.data.body = '공지가 등록되었습니다!!';  //보낼메시지
          } else if (status === statuscode.makeLights) {
            message.data.body = '신호등이 등록되었습니다!!';  //보낼메시지
          } else if (status === statuscode.makeVote) {
            message.data.body = '투표가 등록되었습니다!!';  //보낼메시지
          } else if (status === statuscode.makeRole) {
            message.data.body = '역할이 등록되었습니다!!';  //보낼메시지
          }

          fcm.send(message, function(err, response) {
            if(err) {
              console.log("Something has gone wrong!", err);
              // flag = false;
            } else {
              console.log("Successfully sent with response: ", response);
            }
          });//fcm.send
          // if(!flag) break;
        }  
        
      }
        
        
    }
   
    if (!getUsersListInGroup) {
      return false;
    } else {
      return true;
    }
    // return flag;
  },
  actionNotice : async (...args) => {
    let u_idx = args[0];
    let notice_idx = args[1];
    let updateNoticeResQuery = 'UPDATE tkb.notice_response SET status = ? WHERE notice_idx = ? AND u_idx = ?';
    let updateNoticeRes = await db.queryParamCnt_Arr(updateNoticeResQuery, [1, notice_idx, u_idx]);
    if(!updateNoticeRes) {
      return false;
    } else {
      return true;
    }
  },
  actionLights : async (...args) => {
    let u_idx = args[0];
    let light_idx = args[1];
    let color = args[2];
    let content = args[3];
    let write_time = args[4];
    let updateLightsResQuery = 'UPDATE tkb.light_response SET color = ?, content = ?, write_time = ? WHERE light_idx = ? AND u_idx = ?';
    var updateLightsRes = await db.queryParamCnt_Arr(updateLightsResQuery, [color, content, write_time, light_idx, u_idx]);
    if(!updateLightsRes) {
      return false;
    } else {
      return true;
    }
  },
  actionVote : async (...args) => {
    let u_idx = args[0];
    let vote_idx = args[1];
    let value = args[2];
    let write_time = args[3];

    let updateVoteResQuery = 'UPDATE tkb.vote_response SET value = ?, write_time = ?, status = ? WHERE vote_idx = ? AND u_idx = ?';
    var updateVoteRes = await db.queryParamCnt_Arr(updateVoteResQuery, [value, write_time, 1, vote_idx, u_idx]);
    if (!updateVoteRes) {
      return false;
    } else {
      let getOneVoteResponseQuery = 'SELECT * FROM tkb.vote_response WHERE vote_idx = ?';
      let getOneVoteResponse = await db.queryParamCnt_Arr(getOneVoteResponseQuery, [vote_idx]);

      if (!getOneVoteResponse) {
        return false;
      } else {
        return getOneVoteResponse;
      }
    }
  },
  deleteNotice : async (...args) => {
    let u_idx = args[0];
    let notice_idx = args[1];

    let deleteNoticeQuery = 'DELETE tkb.notice WHERE u_idx = ? AND notice_idx = ?';
    let deleteNotice = await db.queryParamCnt_Arr(deleteNoticeQuery, [u_idx, notice_idx]);

    if (!deleteNotice) {
      return false;
    } else {
      return deleteNotice;
    }
  },
  deleteLights : async (...args) => {
    let u_idx = args[0];
    let light_idx = args[1];

    let deleteLightsQuery = 'DELETE tkb.lights WHERE u_idx = ? AND light_idx = ?';
    let deleteLights = await db.queryParamCnt_Arr(deleteLightsQuery, [u_idx, light_idx]);

    if (!deleteLights) {
      return false;
    } else {
      return deleteLights;
    }
  },
  // deletePick : async (...args) => {
  //   let u_idx = args[0];
  //   let pick_idx = args[1];

  //   let deletePickQuery = 'DELETE tkb.pick WHERE u_idx = ? AND pick_idx = ?';
  //   let deletePick = await db.queryParamCnt_Arr(deletePickQuery, [u_idx, pick_idx]);

  //   if (!deletePick) {
  //     return false;
  //   } else {
  //     return deletePick;
  //   }
  // },
  deleteVote : async (...args) => {
    let u_idx = args[0];
    let vote_idx = args[1];

    let deleteVoteQuery = 'DELETE tkb.vote WHERE u_idx = ? AND vote_idx = ?';
    let deleteVote = await db.queryParamCnt_Arr(deleteVoteQuery, [u_idx, vote_idx]);

    if (!deleteVote) {
      return false;
    } else {
      return deleteVote;
    }
  },
  // showSpecificMemberInChat : async (...args) => {
  //   let g_idx = args[0];

  //   let getUsersListInGroupQuery = 'SELECT u_idx FROM tkb.joined WHERE g_idx = ?';
  //   var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx]);
  //   let result = [];
  //   for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
  //     let getUsersInfoQuery = 'SELECT u_idx, name, photo, id FROM tkb.user WHERE u_idx = ?';
  //     var getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
  //     result.push(getUsersInfo[0]);
  //   }
  //   if(!getUsersListInGroup) {
  //     return false;
  //   } else {
  //     return result;
  //   }
  // },
  // showSpecificMemberInLights : async (...args) => {
  //   let u_idx = args[0];
  //   let g_idx = args[1];

  //   let getUsersListInGroupQuery = 'SELECT u_idx FROM tkb.joined WHERE g_idx = ? AND u_idx != ?';
  //   var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx, u_idx]);
  //   let result = [];

  //   for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
  //     let getUsersInfoQuery = 'SELECT u_idx, name, photo, id FROM tkb.user WHERE u_idx = ?';
  //     var getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
  //     result.push(getUsersInfo[0]);
  //   }
  //   if(!getUsersListInGroup) {
  //     return false;
  //   } else {
  //     return result;
  //   }
  // },
  // showChatLists : async (...args) => {
  //   let u_idx = args[0];
  //
  //   let findUserJoinedQuery = 'SELECT g_idx FROM tkb.joined WHERE u_idx = ?';
  //   var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
  //   let result = [];
  //   for(let i = 0 ; i < findUserJoined.length ; i++) {
  //     let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
  //     var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);
  //
  //     result.push(searchGroupInfo[0]);
  //   }
  //   if(!findUserJoined) {
  //     return false;
  //   } else {
  //     return result;
  //   }
  // },
  showAllGroupsJoined : async (...args) => {
    let u_idx = args[0];

    let findUserJoinedQuery = 'SELECT g_idx FROM tkb.group_joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);
      result.push(searchGroupInfo[0]);
    }
    if(!findUserJoined) {
      return false;
    } else {
      return result;
    }
  },
  showAllChatroomJoined : async (...args) => {
    let u_idx = args[0];
    // let g_idx = args[1];
    // let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
    // var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, g_idx]);
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM tkb.group_chatroom WHERE chatroom_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].chatroom_idx]);
      result.push(searchGroupInfo[0]);
    }
    if(!findUserJoined) {
      return false;
    } else {
      return result;
    }
  },
  leaveGroup : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let getAllChatroomQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
    let getAllChatroom = await db.queryParamCnt_Arr(getAllChatroomQuery, [u_idx, g_idx]);

    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
    for (let i = 0 ; i < getAllChatroom.length ; i++) {
      let insertNewMessageResult = await chat.insertNewMessageInMainFunction(getAllChatroom[i].chatroom_idx, u_idx, write_time, u_idx, 10);
    }
    let leaveGroupQuery = 'DELETE FROM tkb.group_joined WHERE g_idx = ? AND u_idx = ?';
    var leaveGroup = await db.queryParamCnt_Arr(leaveGroupQuery, [g_idx, u_idx]);
    if(!leaveGroup) {
      return false;
    } else {
      let leftPersonCountQuery = 'SELECT u_idx FROM tkb.group_joined WHERE g_idx = ?';
      var leftPersonCount = await db.queryParamCnt_Arr(leftPersonCountQuery, [g_idx]);
      if(leftPersonCount.length === 0) {
        let deleteGroupInfoQuery = 'DELETE FROM tkb.group WHERE g_idx = ?';
        var deleteGroupInfo = await db.queryParamCnt_Arr(deleteGroupInfoQuery, [g_idx]);
      }
      return leaveGroup;
    }
  },
  leaveChatroom : async (...args) => {
    let u_idx = args[0];
    let chatroom_idx = args[1];
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
    
    let insertNewMessageResult = await chat.insertNewMessageInMainFunction(chatroom_idx, u_idx, write_time, u_idx, 10);

    let deleteEndPointQuery = 'DELETE FROM chatroom.endpoint WHERE u_idx = ? AND chatroom_idx = ?';
    let deleteEndPoint = await db.queryParamCnt_Arr(deleteEndPointQuery, [u_idx, chatroom_idx]);

    let leaveChatroomQuery = 'DELETE FROM tkb.chatroom_joined WHERE chatroom_idx = ? AND u_idx = ?';
    var leaveChatroom = await db.queryParamCnt_Arr(leaveChatroomQuery, [chatroom_idx, u_idx]);
    if(!leaveChatroom) {
      return false;
    } else {
      let leftPersonCountQuery = 'SELECT u_idx FROM tkb.chatroom_joined WHERE chatroom_idx = ?';
      var leftPersonCount = await db.queryParamCnt_Arr(leftPersonCountQuery, [chatroom_idx]);
      if(leftPersonCount.length === 0) {
        let deleteChatroomInfoQuery = 'DELETE FROM tkb.group_chatroom WHERE chatroom_idx = ?';
        var deleteChatroomInfo = await db.queryParamCnt_Arr(deleteChatroomInfoQuery, [chatroom_idx]);
      }
      return leaveChatroom;
    }
  },
  closeVote : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let vote_idx = args[2];

    let voteCloseQuery = 'UPDATE tkb.vote SET status = ? WHERE u_idx = ? AND g_idx = ? AND vote_idx = ?';
    var voteCloseResult = await db.queryParamCnt_Arr(voteCloseQuery, [1, u_idx, g_idx, vote_idx]);
    if(!voteCloseResult) {
      return false;
    } else {
      return true;
    }
  },
  sendFCMData : async (...args) => {
    /*  ver2
      나의 정보가 변경되었을 때에는 데이터베이스에서 변화가 있을까?
      i) status === 0 : 그룹 수정, 삭제    그룹 삭제??? 이거 어떻게 할거지???(그룹 삭제를 모든 사람이 나갔을 때 라고 한다면, 따로 작업할 필요는 없다)
         그룹 수정시에 group_index만 넘어오도록 하여 그 그룹에 속한 유저들의 정보만 바뀌게 한다.
         ===> showAllGroupsJoined 이것 사용
      ii) status === 1 : joined 추가, 삭제
         누가 초대되었을 때(joined 추가) : joined table도 수정되어야 하고, user table도 수정되어야 한다. group_index만 넘어오도록 하여 그룹에 속한 유저들의 정보만 바뀌게 한다.
         누가 나갔을 때(joined 삭제) : joined table만 수정되면 된다. group_index만 넘어오도록 하여 그 그룹에 속한 유저들의 정보만 바뀌게 한다.
         ===> getJoinedInfo 이것 사용
      iii) status === 2 : user 정보 변경??? 이거 얘기 한번 해보자
         유저 정보 변경 시 : 내가 속한 모든 그룹의 사람들에게 내 정보가 바뀌었음을 알려야 한다. 이때는 user_index가 넘어와야 한다.
         유저 삭제 시 : 아직 고려하지 않았으니 제낌 => 유저 삭제를 넣는다면 delete cascade 걸어줘야함
         ===> getUserInfo 이것 사용

      문제점) 그룹의 사진, 이름을 바꾸는 라우터가 없기 때문에 i)번을 작업할 필요가 없다.
    */

    /*  ver4
    프로필 수정 => user refresh
    그룹 / 채팅방 수정 => group / chatroom refresh

    그룹에 초대되었을 때(해씀)
    그룹에 존재하는 사람 : Group_joined / user
    그룹에 초대된 사람 : Group_joined / user / group / Chatroom_joined / chatroom 이거invite/group

    채팅방에 초대되었을 때(해씀)
    채팅방에 존재하는 사람 : Chatroom_joined /
    채팅방에 초대된 사람 : Chatroom_joined / chatroom      이거 invite/chatroom

    그룹에서 나갈 때(해씀)
    그룹에 존재하는 사람 : Group_joined / Chatroom_joined
    // 그룹에서 나가는 사람 : Group_joined / Chatroom_joined   이거 /leave/group

    채팅방에서 나갈 때(해씀)
    채팅방에 존재하는 사람 : Chatroom_joined 
    // 채팅방에서 나가는 사람 : Chatroom_joined         이거 /leave/chatroom

    */
    let userArray = args[0];
    let status = args[1];
    let idx = args[2];
    
    var message = {};

    if (status === statuscode.FiveThingsChange) {
      let getAllUserQuery = 'SELECT tkb.user.token, tkb.user.u_idx FROM tkb.group_joined JOIN tkb.user USING(u_idx) WHERE tkb.group_joined.g_idx = ?';
      var getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx]);

      if (getAllUser) {
        for (let i = 0 ; i < getAllUser.length ; i++) {
          let client_token = getAllUser[i].token;
          if (userArray[0] === getAllUser[i].u_idx) {
            message = {
              to: client_token,
              data: {
                data : status
              },
              priority: "high",
              content_available: true
            };  // message
          } else {
            message = {
              to: client_token,
              data: {
                data : statuscode.Group_joinedUserChange
              },
              priority: "high",
              content_available: true
            };  // message
          } // else
          
          fcm.send(message, function(err, response) {
            if(err) {
              console.log("Something has gone wrong!", err);
            } else {
              console.log("Successfully sent with response: ", response);
            }
          }); // fcm.send
        } // for
      } // if (getAllUser)
    } else if (status === statuscode.ChatroomChatroom_joinedChange) {        // 이부분 O(n^2)임 고쳐야함
      let getAllUserQuery = 'SELECT tkb.user.token, tkb.user.u_idx FROM tkb.chatroom_joined JOIN tkb.user USING (u_idx) WHERE tkb.chatroom_joined.chatroom_idx = ?';
      let getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx]);

      if (getAllUser) {
        for (let i = 0 ; i < getAllUser.length ; i++) {
          let client_token = getAllUser[i].token;
          message = {
            to:client_token,
            data: {
              data : statuscode.Chatroom_joinedChange
            },
            priority: "high",
            content_available: true
          };  // message

          for(let j = 0 ; j < userArray.length ; j++) {
            if (userArray[j] === getAllUser[i].u_idx) {
              message.data.data = status;
              break;
            } else {
              continue;
            } // else
          } // for (j)

          fcm.send(message, function(err, response) {
            if(err) {
              console.log("Something has gone wrong!", err);
            } else {
              console.log("Successfully sent with response: ", response);
            }
          }); // fcm.send
        } // for (i)
      } // if (getAllUser)
    } else if (status === statuscode.Group_joinedChatroom_joinedChange) {
      let getAllUserQuery = 'SELECT tkb.user.token, tkb.user.u_idx FROM tkb.group_joined JOIN tkb.user USING (u_idx) WHERE tkb.group_joined.g_idx = ? AND tkb.group_joined.u_idx != ?';
      let getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx, userArray[0]]);

      if (getAllUser) {
        for (let i = 0 ; i < getAllUser.length ; i++) {
          let client_token = getAllUser[i].token;

          message = {
            to: client_token,
            data: {
              data : status
            },
            priority: "high",
            content_available: true
          };  // message

          fcm.send(message, function(err, response) {
            if(err) {
              console.log("Something has gone wrong!", err);
            } else {
              console.log("Successfully sent with response: ", response);
            }
          }); // fcm.send
        } // for
      } // if (getAllUser)
    } else if (status === statuscode.Chatroom_joinedChange) {
      let getAllUserQuery = 'SELECT tkb.user.token, tkb.user.u_idx FROM tkb.chatroom_joined JOIN tkb.user USING (u_idx) WHERE tkb.chatroom_joined.chatroom_idx = ? AND tkb.chatroom_joined.u_idx != ?';
      let getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx, userArray[0]]);

      if (getAllUser) {
        for (let i = 0 ; i < getAllUser.length ; i++) {
          let client_token = getAllUser[i].token;

          message = {
            to: client_token,
            data: {
              data : status
            },
            priority: "high",
            content_available: true
          };  // message

          fcm.send(message, function(err, response) {
            if(err) {
              console.log("Something has gone wrong!", err);
            } else {
              console.log("Successfully sent with response: ", response);
            }
          }); // fcm.send
        } // for
      } // if (getAllUser)
    } else if (status === statuscode.UserChange) {
      //let getAllUserQuery = 'SELECT gj2.u_idx, tkb.user.token FROM tkb.user JOIN (chat.group_joined gj JOIN chat.group_joined gj2 USING(g_idx)) USING(u_idx) WHERE gj.u_idx = ? AND gj2.u_idx != ?';
      let getAllUserQuery = 'SELECT DISTINCT gj2.u_idx, u.token FROM tkb.user u JOIN (tkb.group_joined gj JOIN tkb.group_joined gj2 USING(g_idx)) ON gj2.u_idx = u.u_idx WHERE gj.u_idx = ? AND gj2.u_idx != ?';
      let getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [userArray[0], userArray[0]]);

      if (getAllUser) {
        for (let i = 0 ; i < getAllUser.length ; i++) {
          let client_token = getAllUser[i].token;

          message = {
            to: client_token,
            data: {
              data : status
            },
            priority: "high",
            content_available: true
          };  // message
        } // for
      } // if (getAllUser)
      // let userArray = [];
      // if (getAllUser) {
      //   for(let i = 0 ; i < getAllUser.length ; i++) {          
      //     userArray.push(getAllUser[i].token);
      //   }  

      //   let userArray_wo_dup = Array.from(new Set(userArray));
      //   console.log(userArray_wo_dup);

      //   for(let i = 0 ; i < userArray_wo_dup.length ; i++) {
      //     let client_token = userArray_wo_dup[i];
      //     var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
      //       to: client_token,
      //       data: {
      //         data : status
      //       }
      //     };

      //     fcm.send(message, function(err, response) {
      //       if(err) {
      //         console.log("Something has gone wrong!", err);
      //       } else {
      //         console.log("Successfully sent with response: ", response);
      //       }
      //     }); //fcm.send
      //   }

      // }
    }



    // if(status === statuscode.groupChange || status === statuscode.joinedChange) {
    //   let flag = true;

    //   let getAllUserQuery = 'SELECT u_idx FROM tkb.joined WHERE g_idx = ?';
    //   var getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx]);
    //   //getAllUserQuery 하고 getUserTokenQuery 하고 JOIN 할 수 있을 것 같은데
    //   for(let i = 0 ; i < getAllUser.length ; i++) {
    //     let getUserTokenQuery = 'SELECT token FROM tkb.user WHERE u_idx = ?';
    //     var getUserToken = await db.queryParamCnt_Arr(getUserTokenQuery, [getAllUser[i].u_idx]);
    //     let client_token = getUserToken[0].token;

    //     var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //         to: client_token,
    //         data: {
    //           data : status
    //         }
    //     };

    //     fcm.send(message, function(err, response) {
    //       if(err) {
    //         console.log("Something has gone wrong!", err);
    //         flag = false;
    //       } else {
    //         console.log("Successfully sent with response: ", response);
    //       }
    //     });//fcm.send
    //     if(!flag) break;
    //   }//for(j=0)
    //   return flag;
    // } else if(status === statuscode.userChange) {  //status === 2
    //   let flag = true;

    //   let findUserJoinedQuery = 'SELECT g_idx FROM tkb.joined WHERE u_idx = ?';
    //   var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [idx]);

    //   let userArray = [];
    //   for(let i = 0 ; i < findUserJoined.length ; i++) {
    //     let getAllUserQuery = 'SELECT u_idx FROM tkb.joined WHERE g_idx = ?';
    //     var getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [findUserJoined[i].g_idx]);

    //     //getAllUserQuery 하고 getUserTokenQuery 하고 JOIN 할 수 있을 것 같은데
    //     for(let j = 0 ; j < getAllUser.length ; j++) {
    //       userArray.push(getAllUser[j].u_idx);
    //     }
    //     console.log(userArray);
    //   }
    //   let userArray_wo_dup = Array.from(new Set(userArray));
    //   console.log(userArray_wo_dup);
    //   for(let i = 0 ; i < userArray_wo_dup.length ; i++) {
    //     if(userArray_wo_dup[i] === idx) {
    //       continue;
    //     }
    //     let getUserTokenQuery = 'SELECT token FROM tkb.user WHERE u_idx = ?';
    //     var getUserToken = await db.queryParamCnt_Arr(getUserTokenQuery, [userArray_wo_dup[i]]);
    //     let client_token = getUserToken[0].token;

    //     var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //         to: client_token,
    //         data: {
    //           data : statuscode.userChange
    //         }
    //     };
    //     fcm.send(message, function(err, response) {
    //       if(err) {
    //         console.log("Something has gone wrong!", err);
    //         flag = false;
    //       } else {
    //         console.log("Successfully sent with response: ", response);
    //       }
    //     });//fcm.send
    //     if(!flag) break;
    //   }
    //   return flag;
    // } else if(status === statuscode.groupjoineduserChange) {
    //   let flag = true;

    //   let getAllUserQuery = 'SELECT u_idx FROM tkb.joined WHERE g_idx = ?';
    //   var getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx]);

    //   for(let i = 0 ; i < getAllUser.length ; i++) {
    //     let getUserTokenQuery = 'SELECT token FROM tkb.user WHERE u_idx = ?';
    //     var getUserToken = await db.queryParamCnt_Arr(getUserTokenQuery, [getAllUser[i].u_idx]);
    //     let client_token = getUserToken[0].token;

    //     var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //         to: client_token,
    //         data: {
    //           data : statuscode.groupjoineduserChange
    //         }
    //     };

    //     fcm.send(message, function(err, response) {
    //       if(err) {
    //         console.log("Something has gone wrong!", err);
    //         flag = false;
    //       } else {
    //         console.log("Successfully sent with response: ", response);
    //       }
    //     });//fcm.send
    //     if(!flag) break;
    //   }// for
    //   return flag;
    // } else {
    //   return false;
    // }
  },//sendFCMData
  getGJoinedInfo : async (...args) => {
    let u_idx = args[0];
    let resultArray = [];
    let findUserJoinedQuery = 'SELECT g_idx FROM tkb.group_joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findAllUserJoinedQuery = 'SELECT * FROM tkb.group_joined WHERE g_idx = ?';
      var findAllUserJoined = await db.queryParamCnt_Arr(findAllUserJoinedQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findAllUserJoined.length ; j++) {
        resultArray.push(findAllUserJoined[j]);
      }//for(j=0)
    }//for(i=0)
    if(!findUserJoined) {
      return false;
    } else {
      return resultArray;
    }
  },//getJoinedInfo
  getCJoinedInfo : async (...args) => {
    let u_idx = args[0];
    let resultArray = [];
    let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findAllUserJoinedQuery = 'SELECT * FROM tkb.chatroom_joined WHERE chatroom_idx = ?';
      var findAllUserJoined = await db.queryParamCnt_Arr(findAllUserJoinedQuery, [findUserJoined[i].chatroom_idx]);
      for(let j = 0 ; j < findAllUserJoined.length ; j++) {
        resultArray.push(findAllUserJoined[j]);
      }//for(j=0)
    }//for(i=0)
    if(!findUserJoined) {
      return false;
    } else {
      return resultArray;
    }
  },//getJoinedInfo
  getUserInfo : async (...args) => {
    let u_idx = args[0];

    let findUserJoinedQuery = 'SELECT g_idx FROM tkb.group_joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    let userArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findAllUserQuery = 'SELECT u_idx FROM tkb.group_joined WHERE g_idx = ?';
      var findAllUser = await db.queryParamCnt_Arr(findAllUserQuery, [findUserJoined[i].g_idx]);

      for(let j = 0 ; j < findAllUser.length ; j++) {
        userArray.push(findAllUser[j].u_idx);
      }
      console.log(userArray);
    }
    //userArray_without_duplicate
    let userArray_wo_dup = Array.from(new Set(userArray));

    let result = [];
    for(let i = 0 ; i < userArray_wo_dup.length ; i++) {
      let findUserDetailInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM tkb.user WHERE u_idx = ?';
      var findUserDetailInfo = await db.queryParamCnt_Arr(findUserDetailInfoQuery, [userArray_wo_dup[i]]);

      result.push(findUserDetailInfo[0]);
    }
    return result;
  },
  createRoleProject : async (...args) => {
    let chatroom_idx = args[0];
    let title = args[1];
    let master_idx = args[2];
    let taskArray = args[3];
    let write_time = args[4];
    let flag = true;

    let insertProjectQuery = 'INSERT INTO tkb.role (chatroom_idx, title, master_idx, write_time) VALUES (?, ?, ?, ?)';
    let insertProject = await db.queryParamCnt_Arr(insertProjectQuery, [chatroom_idx, title, master_idx, write_time]);

    if (taskArray) {
      for (let i = 0 ; i < taskArray.length ; i++) {
        let insertTaskQuery = 'INSERT INTO tkb.role_task (role_idx, content) VALUES (?, ?)';
        var insertTask = await db.queryParamCnt_Arr(insertTaskQuery, [insertProject.insertId, taskArray[i]]);
        if (!insertTask) {
          flag = false;
          break;
        }
      }  
    }

    if(!flag || !insertProject) {
      return false;
    } else {
      let insertNewMessageResult = await chat.insertNewMessageInMainFunction(chatroom_idx, insertProject.insertId + '/' + title, write_time, master_idx, 8);
      
      if (!insertNewMessageResult) {
        return false;
      } else {
        return [insertProject.insertId, insertNewMessageResult];
      }
    }
  },
  // createRoleTask : async (...args) => {
  //   let role_idx = args[0];
  //   let content = args[1];

  //   let flag = true;
  //   for (let i = 0 ; i < content.length ; i++) {
  //     let insertRoleTaskQuery = 'INSERT INTO tkb.role_task (role_idx, content) VALUES (?, ?)';
  //     let insertRoleTask = await db.queryParamCnt_Arr(insertRoleTaskQuery, role_idx, content[i]);
  //     if (!insertRoleTask) {
  //       flag = false;
  //       break;
  //     }
  //   }
  //   if (!flag) {
  //     return false;
  //   } else {
  //     return true;
  //   }
  // },
  // createRoleUser : async (...args) => {
  //   let role_task_idx = args[0];
  //   let u_idx = args[1];

  //   let insertRoleUserQuery = 'INSERT INTO tkb.role_user (role_task_idx, u_idx) VALUES (?, ?)';
  //   let insertRoleUser = await db.queryParamCnt_Arr(insertRoleUserQuery, [role_task_idx, u_idx]);

  //   if (!insertRoleUser) {
  //     return false;
  //   } else {
  //     return insertRoleUser;
  //   }
  // },
  createRoleResponse : async (...args) => {
    let role_idx = args[0];
    let role_task_idx = args[1];
    let u_idx = args[2];
    let response_content = args[3];
    let files = args[4];
    let write_time = args[5];

    let checkWriterQuery = 'SELECT u_idx FROM tkb.role_user WHERE role_task_idx = ? AND u_idx = ?';
    var checkWriter = await db.queryParamCnt_Arr(checkWriterQuery, [role_task_idx, u_idx]);
    if (checkWriter.length === 1) {

      // let checkResponseQuery = 'SELECT role_response_idx FROM tkb.role_response WHERE role_task_idx = ? AND u_idx = ?';
      // var checkResponse = await db.queryParamCnt_Arr(checkResponseQuery, [role_task_idx, u_idx]);

      // if (checkResponse.length === 0) {
        let insertResponseQuery = 'INSERT INTO tkb.role_response (role_idx, role_task_idx, content, u_idx, write_time) VALUES (?, ?, ?, ?, ?)';
        var insertResponse = await db.queryParamCnt_Arr(insertResponseQuery, [role_idx, role_task_idx, response_content, u_idx, write_time]);
        console.log(files);
        if (files !== undefined) {
          for(let i = 0 ; i < files.length ; i++) {
            let insertFileQuery = 'INSERT INTO tkb.role_file (role_response_idx, file) VALUES (?, ?)';
            var insertFile = await db.queryParamCnt_Arr(insertFileQuery, [insertResponse.insertId, files[i].location]);
          }  
        } 
      // } else {
      //   return 2;
      // } 
      
      if (!insertResponse) {
        return 0;
      } else {
        return insertResponse;
      }
    } else {
      return -1;
    }
  },
  createRoleFeedback : async (...args) => {
    let u_idx = args[0];
    let role_response_idx = args[1];
    let content = args[2];
    let write_time = args[3];

    let insertFeedbackQuery = 'INSERT INTO tkb.role_feedback (u_idx, role_response_idx, content, write_time) VALUES (?, ?, ?, ?)';
    let insertFeedback = await db.queryParamCnt_Arr(insertFeedbackQuery, [u_idx, role_response_idx, content, write_time]);

    if(!insertFeedback) {
      return false;
    } else {
      return insertFeedback;
    }
  },
  readRoleProject : async (...args) => {
    let u_idx = args[0];
    let type = args[1];
    let index = args[2];

    if (type === 'g') {
      let findUserJoinedQuery = 'SELECT chatroom_idx FROM tkb.chatroom_joined WHERE u_idx = ? AND g_idx = ?';
      let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx, index]);

      let result = [];
      for (let i = 0 ; i < findUserJoined.length ; i++) {
        var getRoleProjectQuery = 'SELECT * FROM tkb.role WHERE chatroom_idx = ?';
        var getRoleProject = await db.queryParamCnt_Arr(getRoleProjectQuery, [findUserJoined[i].chatroom_idx]);
        
        for (let j = 0 ; j < getRoleProject.length ; j++) {
          result.push(getRoleProject[j]);
        }
      }
      return result;
    } else if (type === 'c') {
      var getRoleProjectQuery = 'SELECT * FROM tkb.role WHERE chatroom_idx = ?';
      var getRoleProject = await db.queryParamCnt_Arr(getRoleProjectQuery, [chatroom_idx]);

      if (!getRoleProject) {
        return false;
      } else {
        return getRoleProject;
      }
    } else {
      return false;
    }
  },
  readRoleTask : async (...args) => {
    let role_idx = args[0];

    let getRoleTaskQuery = 'SELECT * FROM tkb.role_task WHERE role_idx = ?';
    let getRoleTask = await db.queryParamCnt_Arr(getRoleTaskQuery, [role_idx]);

    for (let i = 0 ; i < getRoleTask.length ; i++) {
      let getRoleUserQuery = 'SELECT u_idx FROM tkb.role_user WHERE role_task_idx = ?';
      var getRoleUser = await db.queryParamCnt_Arr(getRoleUserQuery, [getRoleTask[i].role_task_idx]);

      let result = [];
      if (getRoleUser) {
        for (let j = 0 ; j < getRoleUser.length ; j++) {
          result.push(getRoleUser[j].u_idx);
        }
        getRoleTask[i].userArray = result;
      }
    }
    if (!getRoleTask) {
      return false;
    } else {
      return getRoleTask;
    }
  },
  readRoleUser : async (...args) => {
    let role_task_idx = args[0];

    let getRoleUserQuery = 'SELECT u_idx FROM tkb.role_user WHERE role_task_idx = ?';
    let getRoleUser = await db.queryParamCnt_Arr(getRoleUserQuery, [role_task_idx]);

    let result = [];
    if (getRoleUser) {
      for (let i = 0 ; i < getRoleUser.length ; i++) {
        result.push(getRoleUser[i].u_idx);
      }
    }
    return result;
  },
  readRoleResponse : async (...args) => {
    let role_task_idx = args[0];

    let getRoleResponseQuery = 'SELECT * FROM tkb.role_response WHERE role_task_idx = ?';
    let getRoleResponse = await db.queryParamCnt_Arr(getRoleResponseQuery, [role_task_idx]);
    var result = [];
    for (let i = 0 ; i < getRoleResponse.length ; i++) {
      let getRoleResponseFileQuery = 'SELECT * FROM tkb.role_file WHERE role_response_idx = ?';
      let getRoleResponseFile = await db.queryParamCnt_Arr(getRoleResponseFileQuery, [getRoleResponse[i].role_response_idx]);

      let getRoleFeedbackCountQuery = 'SELECT COUNT(role_feedback_idx) FROM tkb.role_feedback WHERE role_response_idx = ?';
      let getRoleFeedbackCount = await db.queryParamCnt_Arr(getRoleFeedbackCountQuery, [getRoleResponse[i].role_response_idx]);
      result.push({
        count : getRoleFeedbackCount[0]["COUNT(role_feedback_idx)"],
        u_idx : getRoleResponse[i].u_idx,
        response : getRoleResponse[i],
        file : getRoleResponseFile
      });
    }
    if (!getRoleResponse) {
      return false;
    } else {
      return result;
    }
  },
  readRoleFeedback : async (...args) => {
    let role_response_idx = args[0];

    let getRoleFeedbackQuery = 'SELECT * FROM tkb.role_feedback WHERE role_response_idx = ? ORDER BY role_feedback_idx';
    let getRoleFeedback = await db.queryParamCnt_Arr(getRoleFeedbackQuery, [role_response_idx]);

    if (!getRoleFeedback) {
      return false;
    } else {
      return getRoleFeedback;
    }
  },
  updateRoleProject : async (...args) => {
    let role_idx = args[0];
    let title = args[1];

    let updateRoleProjectQuery = 'UPDATE tkb.role SET title = ? WHERE role_idx = ?';
    let updateRoleProject = await db.queryParamCnt_Arr(updateRoleProjectQuery, [title, role_idx]);

    if (!updateRoleProject) {
      return false;
    } else {
      return updateRoleProject;
    }
  },
  updateRoleTask : async (...args) => {
    let role_idx = args[0];
    let minusArray = args[1];
    let plusArray = args[2];
    
    let flag = true;
    
    if (minusArray) {
      for (let i = 0 ; i < minusArray.length ; i++) {
        let deleteRoleTaskQuery = 'DELETE FROM tkb.role_task WHERE role_task_idx = ?';
        let deleteRoleTask = await db.queryParamCnt_Arr(deleteRoleTaskQuery, [minusArray[i]]);
        if (!deleteRoleTask) {
          flag = false;
          break;
        }
      }
      if (!flag) {
        return false;
      }
    }
    
    if (plusArray) {
      for (let i = 0 ; i < plusArray.length ; i++) {
        let insertRoleTaskQuery = 'INSERT INTO tkb.role_task (role_idx, content) VALUES (?, ?)';
        let insertRoleTask = await db.queryParamCnt_Arr(insertRoleTaskQuery, [role_idx, plusArray[i]]);
        if (!insertRoleTask) {
          flag = false;
          break;
        }
      }
      if (!flag) {
        return false;
      }  
    }
    return true;
  },
  ////////////유저 수정해야함 => 수정하긴 했는데 다시한번 생각해볼것////////////////
  updateRoleUser : async (...args) => {
    let u_idx = args[0];
    let role_idx = args[1];
    let role_task_idx = args[2];
    let minusArray = args[3];
    let plusArray = args[4];
    let status = args[5];

    let flag = true;

    let getMasterIdxQuery = 'SELECT master_idx FROM tkb.role WHERE role_idx = ?';
    let getMasterIdx = await db.queryParamCnt_Arr(getMasterIdxQuery, [role_idx]);

    if (u_idx === getMasterIdx[0].master_idx) {   // master가 추가, 삭제 할 경우
      if (minusArray) {
        for (let i = 0 ; i < minusArray.length ; i++) {
          let deleteRoleUserQuery = 'DELETE FROM tkb.role_user WHERE role_task_idx = ? AND u_idx = ?';
          var deleteRoleUser = await db.queryParamCnt_Arr(deleteRoleUserQuery, [role_task_idx, minusArray[i]]);
          if (!deleteRoleUser) {
            flag = false;
            break;
          }
        }
      }
      
      if (flag === false) {
        return false;
      }
      if (plusArray) {
        for (let i = 0 ; i < plusArray.length ; i++) {
          let insertRoleUserQuery = 'INSERT INTO tkb.role_user (role_task_idx, u_idx) VALUES (?, ?)';
          var insertRoleUser = await db.queryParamCnt_Arr(insertRoleUserQuery, [role_task_idx, plusArray[i]]);
          if (!insertRoleUser) {
            flag = false;
            break;
          }
        }
      }

      if (flag === false) {
        return false;
      }
    } else {    // user가 자신의 것을 추가(flag =)
      if (status === 1) {
        var insertRoleUserQuery = 'INSERT INTO tkb.role_user (role_task_idx, u_idx) VALUES (?, ?)';
        var insertRoleUser = await db.queryParamCnt_Arr(insertRoleUserQuery, [role_task_idx, u_idx]);
        if (!insertRoleUser) {
          flag = false;
        }
      } else if (status === -1) {
        var deleteRoleUserQuery = 'DELETE FROM tkb.role_user WHERE role_task_idx = ? AND u_idx = ?';
        var deleteRoleUser = await db.queryParamCnt_Arr(deleteRoleUserQuery, [role_task_idx, u_idx]);
        if (!deleteRoleUser) {
          flag = false;
        }
      }
    }

    if (flag === false) {
      return false;
    } else {
      return true;
    }
  },
  updateRoleUserIndex : async (...args) => {
    let role_task_idx = args[0];
    let result = [];
    let getUserIndexQuery = 'SELECT u_idx FROM role_user WHERE role_task_idx = ?';
    let getUserIndex = await db.queryParamCnt_Arr(getUserIndexQuery, [role_task_idx]);
    console.log(getUserIndex);
    if (getUserIndex) {
      for (let i = 0 ; i < getUserIndex.length ; i++) {
        result.push(getUserIndex[i].u_idx);
      }
    }
    return result;
  },
  updateRoleResponse : async (...args) => {
    let u_idx = args[0];
    let role_task_idx = args[1];
    let role_response_idx = args[2];
    let response_content = args[3];
    let minusArray = args[4];
    let plusArray = args[5];

    let flag = true;

    let checkWriterQuery = 'SELECT u_idx FROM tkb.role_user WHERE role_task_idx = ? AND u_idx = ?';
    var checkWriter = await db.queryParamCnt_Arr(checkWriterQuery, [role_task_idx, u_idx]);

    if(checkWriter.length === 1) {
      let updateRoleResponseQuery = 'UPDATE tkb.role_response SET content = ? WHERE role_response_idx = ?';
      let updateRoleResponse = await db.queryParamCnt_Arr(updateRoleResponseQuery, [response_content, role_response_idx]);

      if (minusArray) {
        for (let i = 0 ; i < minusArray.length ; i++) {
          let deleteFileQuery = 'DELETE FROM tkb.role_file WHERE role_response_idx = ? AND file = ?';
          let deleteFile = await db.queryParamCnt_Arr(deleteFileQuery, [role_response_idx, minusArray[i]]);

          if (!deleteFile) {
            flag = false;
            break;
          }
        }
        if (flag === false) {
          return false;
        }
      }

      if (plusArray) {
        for (let i = 0 ; i < plusArray.length ; i++) {
          let insertFileQuery = 'INSERT INTO tkb.role_file (role_response_idx, file) VALUES (?, ?)';
          let insertFile = await db.queryParamCnt_Arr(insertFileQuery, [role_response_idx, plusArray[i].location]);

          if (!insertFile) {
            flag = false;
            break;
          }
        }
        if (flag === false) {
          return false;
        }
      }

      if (!updateRoleResponse) {
        return 0;
      } else {
        return updateRoleResponse;
      }
    } else {
      return -1;
    }
  },
  updateRoleFeedback : async (...args) => {
    let u_idx = args[0];
    let role_response_idx = args[1];
    let content = args[2];

    let updateRoleFeedbackQuery = 'UPDATE tkb.role_feedback SET content = ? WHERE u_idx = ? AND role_response_idx = ?';
    let updateRoleFeedback = await db.queryParamCnt_Arr(updateRoleFeedbackQuery, [content, u_idx, role_response_idx]);

    if (!updateRoleFeedback) {
      return false;
    } else {
      return updateRoleFeedback;
    }
  },
  deleteRoleProject : async (...args) => {
    let role_idx = args[0];

    let deleteRoleProjectQuery = 'DELETE FROM tkb.role WHERE role_idx = ?';
    let deleteRoleProject = await db.queryParamCnt_Arr(deleteRoleProjectQuery, [role_idx]);

    if (!deleteRoleProject) {
      return false;
    } else {
      return deleteRoleProject;
    }
  },
  // deleteRoleTask : async (...args) => {
  //   let role_task_idx = args[0];

  //   let deleteRoleTaskQuery = 'DELETE FROM tkb.role_task WHERE role_task_idx = ?';
  //   let deleteRoleTask = await db.queryParamCnt_Arr(deleteRoleTaskQuery, [role_task_idx]);

  //   if (!deleteRoleTask) {
  //     return false;
  //   } else {
  //     return deleteRoleTask;
  //   }
  // },
  // deleteRoleUser : async (...args) => {
  //   let role_task_idx = args[0];
  //   let u_idx = args[1];

  //   let deleteRoleUserQuery = 'DELETE FROM tkb.role_user WHERE role_task_idx = ? AND u_idx = ?';
  //   let deleteRoleUser = await db.queryParamCnt_Arr(deleteRoleUserQuery, [role_task_idx, u_idx]);

  //   if (!deleteRoleUser) {
  //     return false;
  //   } else {
  //     return deleteRoleUser;
  //   }
  // },
  deleteRoleResponse : async (...args) => {
    let role_response_idx = args[0];

    let deleteRoleResponseQuery = 'DELETE FROM tkb.role_response WHERE role_response_idx = ?';
    let deleteRoleResponse = await db.queryParamCnt_Arr(deleteRoleResponseQuery, [role_response_idx]);

    if (!deleteRoleResponse) {
      return false;
    } else {
      return deleteRoleResponse;
    }
  },
  deleteRoleFeedback : async (...args) => {
    let role_response_idx = args[0];
    let u_idx = args[1];

    let deleteRoleFeedbackQuery = 'DELETE FROM tkb.role_feedback WHERE role_response_idx = ? AND u_idx = ?';
    let deleteRoleFeedback = await db.queryParamCnt_Arr(deleteRoleFeedbackQuery, [role_response_idx, u_idx]);

    if (!deleteRoleFeedback) {
      return false;
    } else {
      return deleteRoleFeedback;
    }
  },



/*
    CALENDAR
*/
  addCalendar : async (...args) => {
    let g_idx = args[0];
    let title = args[1];
    let location = args[2];
    let memo = args[3];
    let starttime = args[4];
    let endtime = args[5];

    let insertCalendarQuery = 'INSERT INTO tkb.calendar (g_idx, title, location, memo, starttime, endtime) VALUES (?, ?, ?, ?, ?, ?)';
    var insertCalendar = await db.queryParamCnt_Arr(insertCalendarQuery, [g_idx, title, location, memo, starttime, endtime]);

    if(!insertCalendar) {
      return false;
    } else {
      return true;
    }
  },
  showCalendar : async (...args) => {
    //일정에 색깔 어떻게 표현할거냐?
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM tkb.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM tkb.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let searchCalendarInfoQuery =
      `
      SELECT * FROM chat calendar WHERE g_idx = ?
      AND ( starttime > ? AND starttime < ? ) OR ( endtime > ? AND endtime < ? )
      `;
      var searchCalendarInfo = await db.queryParamCnt_Arr(searchCalendarInfoQuery, [findUserJoined[i].g_idx]);

      if(searchGroupInfo === undefined || searchCalendarInfo === undefined) {
        break;
      }
      result.push(
        {
          name : searchGroupInfo[0],
          data : searchCalendarInfo
        }
      );
    }//for
    if(!findUserJoined || !searchGroupInfo || !searchCalendarInfo) {
      return false;
    } else {
      return result;
    }
  },
  pushCalendar : async (...args) => {
    return true;
  },
  modifyCalendar : async (...args) => {
    let cal_idx = args[0];
    let title = args[1];
    let location = args[2];
    let memo = args[3];
    let starttime = args[4];
    let endtime = args[5];

    //이거는 라우터에서 실행하자
    // let getCalendarQuery = 'SELECT * FROM tkb.calendar WHERE cal_idx = ?';
    // var getCalendar = await db.queryParamCnt_Arr(getCalendarQuery, [cal_idx]);
    let updateCalendarQuery = 'UPDATE tkb.calendar SET title = ? AND location = ? AND memo = ? AND starttime = ? AND endtime = ? WHERE cal_idx = ?';
    var updateCalendar = await db.queryParamCnt_Arr(updateCalendarQuery, [title, location, memo, starttime, endtime, cal_idx]);

    if(!updateCalendar) {
      return false;
    } else {
      return true;
    }
  },
  deleteCalendar : async (...args) => {
    let cal_idx = args[0];

    let deleteCalendarQuery = 'DELETE FROM tkb.calendar WHERE cal_idx = ?';
    var deleteCalendar = await db.queryParamCnt_Arr(deleteCalendarQuery, [cal_idx]);

    if(!deleteCalendar) {
      return false;
    } else {
      return true;
    }
  }

};
