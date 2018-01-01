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
    let searchUserInfo = await db.queryParamCnt_Arr(searchAllInfoQuery, [u_idx]);
    if(searchUserInfo.length === 0) { //해야할까??
      res.status(400).send({
        message : "wrong input"
      });
    } else {
      let insertUserInfoQuery = 'INSERT INTO admin.joined (u_idx, g_idx) VALUES (?,?)';
      let insertUserInfo = await db.queryParamCnt_Arr(insertUserInfoQuery, [u_idx, g_idx]);

      let getRecentChatIndexQuery = 'SELECT count(chat_idx) as count FROM chat.' + searchGroupInfo[0].ctrl_name;
      let getRecentChatIndex = await db.queryParamCnt_None(getRecentChatIndexQuery);
      console.log(getRecentChatIndex);
      // 그전에 최근 채팅 index 값을 가져와야 함
      let setInitialChatEndPointQuery = 'INSERT INTO chat.endpoint (ep_idx, u_idx, g_idx) VALUES (?, ?, ?)';
      let setInitialChatEndPoint = await db.queryParamCnt_Arr(setInitialChatEndPointQuery, [getRecentChatIndex[0].count, u_idx, g_idx]);

      res.status(201).send({
        message : "successfully insert user"
      });
    }
  },// joinNewPerson
  findAllGroupMemberAddr : async (...args) => {
    const u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      //let findGroupNameQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      //let findGroupName = await db.queryParamCnt_Arr(findGroupNameQuery, [g_idx]);
      let findUserIndexQuery = 'SELECT * FROM admin.joined JOIN chat.group ON admin.joined.g_idx=chat.group.g_idx WHERE g_idx = ? AND u_idx != ?';
      let findUserIndex = await db.queryParamCnt_Arr(findUserIndexQuery, [findUserJoined[i].g_idx, u_idx]);

      for(let j = 0 ; j < findUserIndex.length ; j++) {
        let AgendaJson = {};
        AgendaJson.real_name = findUserIndex[j].real_name;
        AgendaJson.ctrl_name = findUserIndex[j].ctrl_name;
        let findUserDetailInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
        let findUserDetailInfo = await db.queryParamCnt_Arr(findUserDetailInfoQuery, [findUserIndex[j].u_idx]);
        AgendaJson.data = findUserDetailInfo;
        // // 이 럼 될 것 같 은 데 ? 되 지 않 을 까 ? 될 거 야 . . . 외 않 되?
        // for(let k = 0 ; k < findUserDetailInfo.length ; k++) {
        //   findUserDetailInfo[k].real_name = findUserIndex[j].real_name;
        //   findUserDetailInfo[k].ctrl_name = findUserIndex[j].ctrl_name;
        // }
      }
      result.push(AgendaJson);
    }
    return result;
  },
  // 미처리 항목 보여주는 뷰(그룹별로 보여줄 때)
  findRestGroupThings : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    if(findUserJoined.length === 0) {   //이거 해야하나??
      res.status(400).send({
        message : "wrong input"
      });
    } else {
      // 공지 밀린 것
      let NoticeArray = [];
      for(let i = 0 ; i < findUserJoined.length ; i++) {
        let GroupArray1 = [];
        let findNoticeIndexQuery = 'SELECT * FROM chat.group JOIN chat.notice USING(g_idx) WHERE g_idx = ?';
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
          NoticeArray.push(GroupArray1);
        }
      }
      // 신호등 밀린 것
      let LightsArray = [];
      for(let i = 0 ; i < findUserJoined.length ; i++) {
        let GroupArray2 = [];
        let findLightsIndexQuery = 'SELECT * FROM chat.group JOIN chat.lights USING(g_idx) WHERE g_idx = ?';
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
          LightsArray.push(GroupArray2);
        }
      }// for(let i = 0)

      //투표 밀린 것
      let VotesArray = [];
      for(let i = 0 ; i < findUserJoined.length ; i++) {
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
          VotesArray.push(GroupArray3);
        }
      }// for(let i = 0)
    }// else

    res.status(200).send({
      message : "success",
      notice : NoticeArray,
      lights : LightsArray,
      votes : VotesArray
    });
  },// findRestGroupThings(그룹별로 보여줄 때)
  // findAllRestThings : async (...args) => {  // 밀린것 보여줄 때(그룹별이 아닌 모든 정보를 시간순으로 보여줌)
  //   let u_idx = args[0];
  //   let findLightsRestDetailQuery = 'SELECT * FROM chat.light_response WHERE u_idx = ? AND color = ?';
  //   let findLightsRestDetail = await db.queryParamCnt_Arr(findLightsRestDetailQuery, [u_idx, "r"]);
  //
  //   for(let i = 0 ; i < findLightsRestDetail.length ; i++) {
  //     let findLightsQuestionQuery = 'SELECT * FROM chat.lights WHERE light_idx = ?';
  //     let findLightsQuestion = await db.queryParamCnt_Arr(findLightsQuestionQuery, [findLightsRestDetailQuery[i].light_idx]);
  //
  //
  //   }
  // },// 밀린것 보여줄 때(그룹별이 아닌 모든 정보를 시간순으로 보여줌)
  homeNotice : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findEachGroupNoticeQuery = 'SELECT * FROM chat.group JOIN chat.notice USING(g_idx) WHERE g_idx = ? ORDER BY chat.notice.write_time';
      let findEachGroupNotice = await db.queryParamCnt_Arr(findEachGroupNoticeQuery, [findUserJoined[i].g_idx]);
      result.push(findEachGroupNotice);
    }
    // res.status(200).send({
    //   message : "success",
    //   data : result
    // });
    return result;
  },
  homeLights : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findEachGroupLightsQuery = 'SELECT * FROM chat.group JOIN chat.lights USING(g_idx) WHERE g_idx = ? ORDER BY chat.lights.light_idx';
      let findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupLights.length ; j++) {
        let AgendaJson = {};                      //이상하다 다시 생각해보자
        AgendaJson.Q = findEachGroupLights[j];
        if(findEachGroupLights[j].status === true) {  //true check
          let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE g_idx = ? AND light_idx = ?';
          let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [findUserJoined[i].g_idx, findEachGroupLights[j].light_idx]);
          AgendaJson.A = findEachGroupLightsResAll;
        } else {
          let findEachGroupLightsResAloneQuery = 'SELECT * FROM chat.light_response WHERE g_idx = ? AND u_idx = ? AND light_idx = ?';
          let findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [findUserJoined[i].g_idx, u_idx, findEachGroupLights[j].light_idx]);
          AgendaJson.A = findEachGroupLightsResAlone; //배열?
        }
        groupArray.push(AgendaJson);
      }
      result.push(groupArray);
    }

    // 발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findEachGroupLightsQuery = 'SELECT * FROM chat.group JOIN chat.lights USING(g_idx) WHERE g_idx = ? AND u_idx = ? ORDER BY chat.lights.light_idx';
      let findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx, u_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupLights.length ; j++) {
        let AgendaJson = {};                      //이상하다 다시 생각해보자
        AgendaJson.Q = findEachGroupLights[j];

        let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE g_idx = ? AND light_idx = ?';
        let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [findUserJoined[i].g_idx, findEachGroupLights[j].light_idx]);
        AgendaJson.A = findEachGroupLightsResAll;

        groupArray.push(AgendaJson);
      }
      result.push(groupArray);
    }
    return result;
  },
  homePick : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findEachGroupPickQuery = 'SELECT * FROM chat.group JOIN chat.pick USING(g_idx) WHERE u_idx = ? AND g_idx = ? ORDER BY write_time';
      let findEachGroupPick = await db.queryParamCnt_Arr(findEachGroupPickQuery, [u_idx, findUserJoined[i].g_idx]);
      result.push(findEachGroupPick);
    }
    // res.status(200).send({
    //   message : "success",
    //   data : result
    // });
    return result;
  },
  homeVote : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findEachGroupVoteQuery = 'SELECT * FROM chat.group JOIN chat.vote USING(g_idx) WHERE g_idx = ? ORDER BY chat.vote.vote_idx';
      let findEachGroupVote = await db.queryParamCnt_Arr(findEachGroupVoteQuery, [findUserJoined[i].g_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupVote.length ; j++) {
        let agenda = {};
        agenda.Q = findEachGroupVote[j];
        if(findEachGroupVote[j].status === true) {
          let findEachGroupVoteResAllQuery = 'SELECT * FROM chat.vote_response WHERE g_idx = ? AND vote_idx = ?';
          let findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [findUserJoined[i].g_idx, findEachGroupVote[j].vote_idx]);
          agenda.A = findEachGroupVoteResAll;
        } else {
          let findEachGroupVoteResAloneQuery = 'SELECT * FROM chat.vote_response WHERE g_idx = ? AND u_idx = ? AND vote_idx = ?';
          let findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupVoteResAloneQuery, [findUserJoined[i].g_idx, u_idx, findEachGroupVote[j].vote_idx]);
          agenda.A = findEachGroupLightsResAlone; //배열?
        }
        result.push(agenda);

      }
    }
    return result;
  },
  forEachNotice : async (...args) => {
    let g_idx = args[0];
    //let showAllNoticeQuery = 'SELECT * FROM chat.group JOIN chat.notice USING(g_idx) WHERE g_idx = ? ORDER BY write_time';  //이름 같이 전송해야 할 때
    let showAllNoticeQuery = 'SELECT * FROM chat.notice WHERE g_idx = ? ORDER BY notice_idx DESC';
    let showAllNotice = await db.queryParamCnt_Arr(showAllNoticeQuery, [g_idx]);
    // res.status(200).send({
    //   message : "success",
    //   data : showAllNotice
    // });
    return showAllNotice;
  },// forEachNotice
  forEachLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let result = [];
    let showAllLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? ORDER BY light_idx';
    let showAllLights = await db.queryParamCnt_Arr(showAllLightsQuery, [g_idx]);
    for(let i = 0 ; i < showAllLights.length ; i++) {
      let agenda = {};
      agenda.Q = showAllLights[i];
      if(showAllLights.status === true) {
        let showAllLightsDetailQuery = 'SELECT * FROM chat.light_response WHERE g_idx = ? AND light_idx = ?';
        let showAllLightsDetail = await db.queryParamCnt_Arr(showAllLightsDetailQuery, [g_idx, showAllLights[i].light_idx]);
        agenda.A = showAllLightsDetail;
      } else {
        let showMineLightsDetailQuery = 'SELECT * FROM chat.light_response WHERE g_idx = ? AND light_idx = ? AND u_idx = ?';
        let showMineLightsDetail = await db.queryParamCnt_Arr(showMineLightsDetailQuery, [g_idx, showAllLights[i].light_idx, u_idx]);
        agenda.A = showMineLightsDetail;  // 배열?
      }
      result.push(agenda);
    }
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
    let groupArray = [];
    for(let i = 0 ; i < findEachGroupVote.length ; i++) {
      let agenda = {};
      agenda.Q = findEachGroupVote[i];
      if(findEachGroupVote[i].status === "t") {
        let findEachGroupVoteResAllQuery = 'SELECT * FROM chat.vote_response WHERE g_idx = ? AND vote_idx = ?';
        let findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [g_idx, findEachGroupVote[i].vote_idx]);
        agenda.A = findEachGroupVoteResAll;
      } else {
        let findEachGroupVoteResAloneQuery = 'SELECT * FROM chat.vote_response WHERE g_idx = ? AND u_idx = ? AND vote_idx = ?';
        let findEachGroupVoteResAlone = await db.queryParamCnt_Arr(findEachGroupVoteResAloneQuery, [g_idx, u_idx, findEachGroupVote[i].vote_idx]);
        agenda.A = findEachGroupVoteResAlone; //배열?
      }
      result.push(agenda);

    }
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
    return insertNoticeResponse;
  },
  makeLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let status = args[2];
    let content = args[3];
    // 이것은 피엠찡과 얘기해보자
    let write_time = args[4];
    let chat_idx = args[5];
    let userArray = args[6];        // select 문을 한 결과가 넘어와야 함

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertLightsQuery = 'INSERT INTO chat.lights (u_idx, g_idx, status, content, write_time, chat_idx) VALUES (?, ?, ?, ?, ?, ?)';
    let insertLights = await db.queryParamCnt_Arr(insertLightsQuery, [u_idx, g_idx, status, content, write_time, chat_idx]);

    if(status === true) {
      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
      let searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx]);
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
    return insertLightsResponse;
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
    let insertVote = await db.queryParamCnt_Arr(insertVoteQuery, [u_idx, chat_idx, g_idx, write_time, content]);

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
    let searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertLightsResponseQuery = 'INSERT INTO chat.vote_response (vote_idx, u_idx, status, value, write_time) VALUES (?, ?, ?, ?, ?)';
      let insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertVote.insertId, searchAllUsersInSpecificGroup[i].u_idx, "n", null, null]);
    }
    res.status(201).send({
      message : "Success Add Vote"
    });
  },
  actionLights : async (...args) => {
    let u_idx = args[0];
    let light_idx = args[1];
    let color = args[2];
    let content = args[3];
    let write_time = args[4];

    let updateLightsResQuery = 'UPDATE chat.light_response SET color = ?, content = ?, write_time = ? WHERE light_idx = ? AND u_idx = ?';
    let updateLightsRes = await db.queryParamCnt_Arr(updateLightsResQuery, [color, content, write_time, light_idx, u_idx]);
    res.status(201).send({
      message : "Success Update Lights Response"
    });
  },
  actionVote : async (...args) => {
    let u_idx = args[0];
    let vote_idx = args[1];
    let status = args[2];
    let value = args[3];
    let write_time = args[4];

    let updateVoteResQuery = 'UPDATE chat.vote_response SET value = ?, write_time = ? WHERE vote_idx = ? AND u_idx = ?';
    let updateVoteRes = await db.queryParamCnt_Arr(updateVoteResQuery, [value, write_time, vote_idx, u_idx]);
    res.status(201).send({
      message : "Success Update Vote Response"
    });
  },
  showSpecificMemberInLights : async (...args) => {
    let g_idx = args[0];

    let getUsersListInGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
    let getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx]);
    let result = [];
    for(let i = 0 ; i < getUsersInfoInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
      let getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [u_idx]);
      result.push(getUsersInfo[0]);
    }
  return result;
  }
};
