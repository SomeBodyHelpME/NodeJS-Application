const async = require('async');
const moment = require('moment');

const pool = require('../config/dbPool.js');
const db = require('./pool.js');

/* groupName get */
// let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
// let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

/* Join 한 User 의 g_idx get */
// let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
// let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);


module.exports = {
  makeNewChatRoomTable : async (...args) => {
    const name = args[0];
    const u_idx = args[1];
    var ctrl_name = name + '_' + moment().format('YYMMDDHHmmss');
    let createTableQuery =
    `
    CREATE TABLE IF NOT EXISTS chat.` + ctrl_name + ` (
      chat_idx INT(11) NOT NULL AUTO_INCREMENT,
      content TEXT NULL DEFAULT NULL,
      write_time VARCHAR(45) NULL DEFAULT NULL,
      count INT(11) NULL DEFAULT NULL,
      u_idx INT(11) NULL DEFAULT NULL,
      user_photo TEXT NULL DEFAULT NULL,
      PRIMARY KEY (chat_idx))
    ENGINE = InnoDB
    DEFAULT CHARACTER SET = utf8;
    `;

    let createTable = await db.queryParamCnt_None(createTableQuery);
    console.log("createTable", createTable);
    let insertGroupQuery = 'INSERT INTO chat.group (real_name, ctrl_name) VALUES (?,?)';
    let insertGroup = await db.queryParamCnt_Arr(insertGroupQuery, [name, ctrl_name]);
    console.log("insertGroup", insertGroup);
    let insertJoinedQuery = 'INSERT INTO admin.joined (u_idx, g_idx) VALUES (?,?)';
    let insertJoined = await db.queryParamCnt_Arr(insertJoinedQuery, [u_idx, insertGroup.insertId]);///체크할것
    console.log("insertJoined", insertJoined);
  },// makeNewChatRoomTable
  joinNewPerson : async (...args) => {
    const g_idx = args[0];
    const u_idx = args[1];

    let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);
    let searchUserInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
    let searchUserInfo = await db.queryParamCnt_Arr(searchUserInfoQuery, [u_idx]);

    let insertUserInfoQuery = 'INSERT INTO admin.joined (u_idx, g_idx) VALUES (?,?)';
    let insertUserInfo = await db.queryParamCnt_Arr(insertUserInfoQuery, [u_idx, g_idx]);

    let getRecentChatIndexQuery = 'SELECT count(chat_idx) as count FROM chat.' + searchGroupInfo[0].ctrl_name;
    let getRecentChatIndex = await db.queryParamCnt_None(getRecentChatIndexQuery);
    console.log(getRecentChatIndex);
    // 그전에 최근 채팅 index 값을 가져와야 함
    let setInitialChatEndPointQuery = 'INSERT INTO chat.endpoint (ep_idx, u_idx, g_idx) VALUES (?, ?, ?)';
    let setInitialChatEndPoint = await db.queryParamCnt_Arr(setInitialChatEndPointQuery, [getRecentChatIndex[0].count, u_idx, g_idx]);
  },// joinNewPerson
  findAllGroupMemberAddr : async (...args) => {
    const u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findGroupNameQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let findGroupName = await db.queryParamCnt_Arr(findGroupNameQuery, [findUserJoined[i].g_idx]);
      let findUserIndexQuery = 'SELECT * FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
      let findUserIndex = await db.queryParamCnt_Arr(findUserIndexQuery, [findUserJoined[i].g_idx, u_idx]);
      let GroupArray = [];
      for(let j = 0 ; j < findUserIndex.length ; j++) {
        let findUserDetailInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
        let findUserDetailInfo = await db.queryParamCnt_Arr(findUserDetailInfoQuery, [findUserIndex[j].u_idx]);
        GroupArray.push(findUserDetailInfo[0]);
      }
      let GroupJson = {
        name : findGroupName,
        data : GroupArray
      };
      result.push(GroupJson);
    }
    return result;
  },
  // 미처리 항목 보여주는 뷰(그룹별로 보여줄 때)
  findRestGroupThings : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 공지 밀린 것
    let NoticeArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let GroupArray1 = [];
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findNoticeIndexQuery = 'SELECT * FROM chat.notice WHERE g_idx = ?';
      let findNoticeIndex = await db.queryParamCnt_Arr(findNoticeIndexQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findNoticeIndex.length ; j++) {
        let findNoticeQuery = 'SELECT * FROM chat.notice_response WHERE notice_idx = ? AND status = ? AND u_idx';
        let findNotice = await db.queryParamCnt_Arr(findNoticeQuery, [findNoticeIndex[j].notice_idx, false, u_idx]);
        if(findNotice.length != 0) {
          let AgendaJson = findNoticeIndex[j];
          GroupArray1.push(AgendaJson);
        }
      }
      if(GroupArray1.length != 0) {
        GroupJson.name = searchGroupInfo;
        GroupJson.data = GroupArray1;
        NoticeArray.push(GroupJson);
      }
    }
    // 신호등 밀린 것
    let LightsArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let GroupArray2 = [];
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findLightsIndexQuery = 'SELECT * FROM chat.lights WHERE g_idx = ?';
      let findLightsIndex = await db.queryParamCnt_Arr(findLightsIndexQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findLightsIndex.length ; j++) {
        let findLightsQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ? AND color = ? AND u_idx = ?';
        let findLights = await db.queryParamCnt_Arr(findLightsQuery, [findLightsIndex[j].light_idx, "r", u_idx]); // 색깔 : r y g
        if(findLights.length != 0) {
          let AgendaJson = findLightsIndex[j];
          GroupArray2.push(AgendaJson);
        }
      }// for(let j = 0)
      if(GroupArray2.length != 0) {
        GroupJson.name = searchGroupInfo;
        GroupJson.data = GroupArray2;
        LightsArray.push(GroupJson);
      }
    }// for(let i = 0)

    //투표 밀린 것
    let VotesArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let GroupArray3 = [];
      let findVotesIndexQuery = 'SELECT * FROM chat.group JOIN chat.vote USING(g_idx) WHERE g_idx = ?';
      let findVotesIndex = await db.queryParamCnt_Arr(findVotesIndexQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findVotesIndex.length ; j++) {
        let findVotesQuery = 'SELECT * FROM chat.vote_response WHERE vote_idx = ? AND status = ? AND u_idx = ?';
        let findVotes = await db.queryParamCnt_Arr(findVotesQuery, [findVotesIndex[j].vote_idx, false, u_idx]); // 미응답은 : w, 응답은 : a
        if(findVotes.length != 0) {
          let AgendaJson = findVotesIndex[j];
          GroupArray3.push(AgendaJson);
        }
      }// for(let j = 0)
      if(GroupArray3.length != 0) {
        GroupJson.name = searchGroupInfo;
        GroupJson.data = GroupArray3;
        VotesArray.push(GroupJson);
      }
    }// for(let i = 0)

    let result = {
      notice : NoticeArray,
      lights : LightsArray,
      votes : VotesArray
    };
    return result;
  },// findRestGroupThings(그룹별로 보여줄 때)
  homeNotice : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupNoticeQuery = 'SELECT * FROM chat.notice WHERE g_idx = ? ORDER BY chat.notice.write_time';
      let findEachGroupNotice = await db.queryParamCnt_Arr(findEachGroupNoticeQuery, [findUserJoined[i].g_idx]);

      result.push(
        {
          name : searchGroupInfo,
          data : findEachGroupNotice
        }
      );
    }
    return result;
  },
  homeLights : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? ORDER BY chat.lights.light_idx';
      let findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupLights.length ; j++) {
        let AgendaJson = {};                      //이상하다 다시 생각해보자

        if(findEachGroupLights[j].open_status === true) {  //true check
          let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ?';
          let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [findEachGroupLights[j].light_idx]);
          if(findEachGroupLightsResAll.length != 0) {
            AgendaJson.Q = findEachGroupLights[j];
            AgendaJson.A = findEachGroupLightsResAll;
          }
        } else {
          let findEachGroupLightsResAloneQuery = 'SELECT * FROM chat.light_response WHERE u_idx = ? AND light_idx = ?';
          let findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [u_idx, findEachGroupLights[j].light_idx]);
          if(findEachGroupLightsResAlone.length != 0) {
            AgendaJson.Q = findEachGroupLights[j];
            AgendaJson.A = findEachGroupLightsResAlone;
          }
        }
        groupArray.push(AgendaJson);
      }
      GroupJson.name = searchGroupInfo;
      GroupJson.data = groupArray;
      resArray.push(GroupJson);
    }

    // 발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? AND u_idx = ? ORDER BY chat.lights.light_idx';
      let findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx, u_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupLights.length ; j++) {
        let AgendaJson = {};                      //이상하다 다시 생각해보자
        AgendaJson.Q = findEachGroupLights[j];

        let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ?';
        let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [findEachGroupLights[j].light_idx]);
        AgendaJson.A = findEachGroupLightsResAll;

        groupArray.push(AgendaJson);
      }
      GroupJson.name = searchGroupInfo;
      GroupJson.data = groupArray;
      reqArray.push(GroupJson);

    }
    let result = {
      response : resArray,
      request : reqArray
    };
    return result;
  },
  homePick : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupPickQuery = 'SELECT * FROM chat.group JOIN chat.pick USING(g_idx) WHERE u_idx = ? AND g_idx = ? ORDER BY write_time';
      let findEachGroupPick = await db.queryParamCnt_Arr(findEachGroupPickQuery, [u_idx, findUserJoined[i].g_idx]);
      result.push(
        {
          name : searchGroupInfo,
          data : findEachGroupPick
        }
      );
    }
    return result;
  },
  homeVote : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupVoteQuery = 'SELECT * FROM chat.vote WHERE g_idx = ? ORDER BY chat.vote.vote_idx';
      let findEachGroupVote = await db.queryParamCnt_Arr(findEachGroupVoteQuery, [findUserJoined[i].g_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupVote.length ; j++) {
        let agenda = {};
        agenda.Q = findEachGroupVote[j];
        if(findEachGroupVote[j].status === true) {
          let findEachGroupVoteResAllQuery = 'SELECT * FROM chat.vote_response JOIN admin.user USING(u_idx) WHERE g_idx = ? AND vote_idx = ?';
          let findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [findUserJoined[i].g_idx, findEachGroupVote[j].vote_idx]);
          agenda.A = findEachGroupVoteResAll;
        } else {
          let findEachGroupVoteResAloneQuery = 'SELECT * FROM chat.vote_response JOIN admin.user USING(u_idx) WHERE g_idx = ? AND u_idx = ? AND vote_idx = ?';
          let findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupVoteResAloneQuery, [findUserJoined[i].g_idx, u_idx, findEachGroupVote[j].vote_idx]);
          agenda.A = findEachGroupLightsResAlone; //배열?
        }
        groupArray.push(agenda);
      }
      GroupJson.name = searchGroupInfo;
      GroupJson.data = groupArray;
      result.push(GroupJson);
    }
    return result;
  },
  forEachNotice : async (...args) => {
    let g_idx = args[0];
    //let showAllNoticeQuery = 'SELECT * FROM chat.group JOIN chat.notice USING(g_idx) WHERE g_idx = ? ORDER BY write_time';  //이름 같이 전송해야 할 때
    let showAllNoticeQuery = 'SELECT * FROM chat.notice WHERE g_idx = ? ORDER BY notice_idx DESC';
    let showAllNotice = await db.queryParamCnt_Arr(showAllNoticeQuery, [g_idx]);
    return showAllNotice;
  },// forEachNotice
  forEachLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    // 수신자에 대한 내용

    let resArray = [];
    let findEachGroupLightsResQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? ORDER BY chat.lights.light_idx';
    let findEachGroupLightsRes = await db.queryParamCnt_Arr(findEachGroupLightsResQuery, [g_idx]);
    for(let j = 0 ; j < findEachGroupLightsRes.length ; j++) {
      let AgendaJson = {};                      //이상하다 다시 생각해보자

      if(findEachGroupLightsRes[j].open_status === 1) {  //true check
        let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ?';
        let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [findEachGroupLightsRes[j].light_idx]);
        if(findEachGroupLightsResAll.length != 0) {
          AgendaJson.Q = findEachGroupLightsRes[j];
          AgendaJson.A = findEachGroupLightsResAll;
        }
      } else {
        let findEachGroupLightsResAloneQuery = 'SELECT * FROM chat.light_response WHERE u_idx = ? AND light_idx = ?';
        let findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [u_idx, findEachGroupLightsRes[j].light_idx]);
        if(findEachGroupLightsResAlone.length != 0) {
          AgendaJson.Q = findEachGroupLightsRes[j];
          AgendaJson.A = findEachGroupLightsResAlone;
        }
      }
      resArray.push(AgendaJson);
    }


    // 발신자에 대한 내용
    let reqArray = [];

    let findEachGroupLightsReqQuery = 'SELECT * FROM chat.group JOIN chat.lights USING(g_idx) WHERE g_idx = ? AND u_idx = ? ORDER BY chat.lights.light_idx';
    let findEachGroupLightsReq = await db.queryParamCnt_Arr(findEachGroupLightsReqQuery, [g_idx, u_idx]);
    for(let j = 0 ; j < findEachGroupLightsReq.length ; j++) {
      let AgendaJson = {};                      //이상하다 다시 생각해보자
      AgendaJson.Q = findEachGroupLightsReq[j];

      let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE g_idx = ? AND light_idx = ?';
      let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [g_idx, findEachGroupLightsReq[j].light_idx]);
      AgendaJson.A = findEachGroupLightsResAll;

      reqArray.push(AgendaJson);
    }


    let result = {
      response : resArray,
      request : reqArray
    };
    return result;
  },// forEachLights
  forEachPick : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let showAllPickQuery = 'SELECT * FROM chat.group JOIN chat.pick USING(g_idx) WHERE u_idx = ? AND g_idx = ? ORDER BY write_time';
    let showAllPick = await db.queryParamCnt_Arr(showAllPickQuery, [u_idx, g_idx]);
    // res.status(200).send({
    //   message : "success",
    //   data : showAllPick
    // });
    return showAllPick;
  },// forEachPick
  forEachVote : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let result = [];
    let showAllVoteQuery = 'SELECT * FROM chat.group JOIN chat.vote USING(g_idx) WHERE g_idx = ? ORDER BY chat.vote.vote_idx';
    let showAllVote = await db.queryParamCnt_Arr(showAllVoteQuery, [g_idx]);
    for(let i = 0 ; i < showAllVote.length ; i++) {
      let agenda = {};
      agenda.Q = showAllVote[i];

      let findEachGroupVoteResAllQuery = 'SELECT * FROM chat.vote_response JOIN admin.user USING(u_idx) WHERE g_idx = ? AND vote_idx = ?';
      let findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [g_idx, showAllVote[i].vote_idx]);
      agenda.A = findEachGroupVoteResAll;

      result.push(agenda);
    }
    return result;
  },// forEachVote
  makeNotice : async (...args) => {
    let u_idx = args[0];
    let chat_idx = args[1];
    let g_idx = args[2];
    let write_time = args[3];
    let content = args[4];

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertNoticeQuery = 'INSERT INTO chat.notice (u_idx, chat_idx, g_idx, write_time, content) VALUES (?, ?, ?, ?, ?)';
    let insertNotice = await db.queryParamCnt_Arr(insertNoticeQuery, [u_idx, chat_idx, g_idx, write_time, content]);

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
    let searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertNoticeResponseQuery = 'INSERT INTO chat.notice_response (notice_idx, u_idx, status) VALUES (?, ?, ?)';
      let insertNoticeResponse = await db.queryParamCnt_Arr(insertNoticeResponseQuery, [insertNotice.insertId, searchAllUsersInSpecificGroup[i].u_idx, false]);
    }
  },
  makeLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let open_status = args[2];
    let entire_status = args[3];
    let content = args[4];
    // 이것은 피엠찡과 얘기해보자
    let write_time = args[5];
    let chat_idx = args[6];
    let userArray = args[7];        // select 문을 한 결과가 넘어와야 함

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertLightsQuery = 'INSERT INTO chat.lights (u_idx, g_idx, open_status, entire_status, content, write_time, chat_idx) VALUES (?, ?, ?, ?, ?, ?, ?)';
    let insertLights = await db.queryParamCnt_Arr(insertLightsQuery, [u_idx, g_idx, open_status, entire_status, content, write_time, chat_idx]);

    if(entire_status === 1) {
      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
      let searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx,u_idx]);
      for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
        let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
        let insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, searchAllUsersInSpecificGroup[i].u_idx, "r", null, null]);
      }
    } else {
      for(let i = 0 ; i < userArray.length ; i++) {
        let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
        let insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, userArray[i].u_idx, "r", null, null]);
      }
    }
  },
  makePick : async (...args) => {
    let u_idx = args[0];
    let chat_idx = args[1];
    let g_idx = args[2];
    let write_time = args[3];
    let content = args[4];

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertPickQuery = 'INSERT INTO chat.pick (u_idx, chat_idx, g_idx, write_time, content) VALUES (?, ?, ?, ?, ?)';
    let insertPick = await db.queryParamCnt_Arr(insertPickQuery, [u_idx, chat_idx, g_idx, write_time, content]);
    return insertPick;
  },
  makeVote : async (...args) => {
    let u_idx = args[0];
    let chat_idx = args[1];
    let g_idx = args[2];

    let write_time = args[3];
    let content = args[4];
    let title = args[5];

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertVoteQuery = 'INSERT INTO chat.vote (u_idx, chat_idx, g_idx, write_time, content, title) VALUES (?, ?, ?, ?, ?, ?)';
    let insertVote = await db.queryParamCnt_Arr(insertVoteQuery, [u_idx, chat_idx, g_idx, write_time, content, title]);

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
    let searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertLightsResponseQuery = 'INSERT INTO chat.vote_response (vote_idx, u_idx, status, value, write_time) VALUES (?, ?, ?, ?, ?)';
      let insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertVote.insertId, searchAllUsersInSpecificGroup[i].u_idx, "n", null, null]);
    }
  },
  actionLights : async (...args) => {
    let u_idx = args[0];
    let light_idx = args[1];
    let color = args[2];
    let content = args[3];
    let write_time = args[4];
    let updateLightsResQuery = 'UPDATE chat.light_response SET color = ?, content = ?, write_time = ? WHERE light_idx = ? AND u_idx = ?';
    let updateLightsRes = await db.queryParamCnt_Arr(updateLightsResQuery, [color, content, write_time, light_idx, u_idx]);
  },
  actionVote : async (...args) => {
    let u_idx = args[0];
    let vote_idx = args[1];
    let value = args[2];
    let write_time = args[3];

    let updateVoteResQuery = 'UPDATE chat.vote_response SET value = ?, write_time = ? WHERE vote_idx = ? AND u_idx = ?';
    let updateVoteRes = await db.queryParamCnt_Arr(updateVoteResQuery, [value, write_time, vote_idx, u_idx]);
  },
  showSpecificMemberInChat : async (...args) => {
    let g_idx = args[0];

    let getUsersListInGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
    let getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx]);
    let result = [];
    for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
      let getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
      result.push(getUsersInfo[0]);
    }
    return result;
  },
  showSpecificMemberInLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let getUsersListInGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
    let getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx, u_idx]);
    let result = [];

    for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
      let getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
      result.push(getUsersInfo[0]);
    }
    return result;
  },
  showChatLists : async (...args) => {
    let u_idx = args[0];

    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

      let getInfoAboutSpecificGroupQuery = 'SELECT * FROM chat.' + searchGroupInfo[0].ctrl_name;
      let getInfoAboutSpecificGroup = await db.queryParamCnt_None(getInfoAboutSpecificGroupQuery);
      let AgendaJson = {
        name : searchGroupInfo,
        data : getInfoAboutSpecificGroup
      };
      result.push(AgendaJson);
    }
    return result;
  }
};