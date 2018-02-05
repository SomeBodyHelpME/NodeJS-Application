const async = require('async');
const moment = require('moment');

const pool = require('../config/dbPool.js');
const db = require('./pool.js');
const statuscode = require('./statuscode.js');

// FCM
const FCM = require('fcm-node');
const serverKey = require('../config/serverKey').key;
const fcm = new FCM(serverKey);

/* groupName get */
// let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
// let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

/* Join 한 User 의 g_idx get */
// let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
// let findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);


module.exports = {
  joinNewPerson : async (...args) => {
    const g_idx = args[0];
    const u_idx = args[1];

    let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);
    let searchUserInfoQuery = 'SELECT * FROM chat.user WHERE u_idx = ?';
    var searchUserInfo = await db.queryParamCnt_Arr(searchUserInfoQuery, [u_idx]);

    let insertUserInfoQuery = 'INSERT INTO chat.joined (u_idx, g_idx) VALUES (?,?)';
    var insertUserInfo = await db.queryParamCnt_Arr(insertUserInfoQuery, [u_idx, g_idx]);

    if(!searchGroupInfo || !searchUserInfo || !insertUserInfo) {
      return false;
    } else {
      return true;
    }
  },// joinNewPerson
  findAllGroupMemberAddr : async (...args) => {
    const u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findGroupNameQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var findGroupName = await db.queryParamCnt_Arr(findGroupNameQuery, [findUserJoined[i].g_idx]);
      let findUserIndexQuery = 'SELECT * FROM chat.joined WHERE g_idx = ? AND u_idx != ?';
      var findUserIndex = await db.queryParamCnt_Arr(findUserIndexQuery, [findUserJoined[i].g_idx, u_idx]);
      let GroupArray = [];
      for(let j = 0 ; j < findUserIndex.length ; j++) {
        let findUserDetailInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM chat.user WHERE u_idx = ?';
        var findUserDetailInfo = await db.queryParamCnt_Arr(findUserDetailInfoQuery, [findUserIndex[j].u_idx]);
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
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 공지 밀린 것
    let NoticeArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let GroupArray1 = [];
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findNoticeIndexQuery = 'SELECT * FROM chat.notice WHERE g_idx = ?';
      var findNoticeIndex = await db.queryParamCnt_Arr(findNoticeIndexQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findNoticeIndex.length ; j++) {
        let findNoticeQuery = 'SELECT * FROM chat.notice_response WHERE notice_idx = ? AND status = ? AND u_idx = ?';
        var findNotice = await db.queryParamCnt_Arr(findNoticeQuery, [findNoticeIndex[j].notice_idx, 0, u_idx]);
        if(findNotice.length != 0) {
          let AgendaJson = findNoticeIndex[j];
          GroupArray1.push(AgendaJson);
        }
      }
      if(GroupArray1.length != 0) {
        GroupJson.name = searchGroupInfo[0];
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
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findLightsIndexQuery =
      `SELECT chat.lights.*, chat.user.photo, chat.user.name, chat.user.id
      FROM chat.lights JOIN chat.user USING(u_idx) WHERE g_idx = ?`;
      var findLightsIndex = await db.queryParamCnt_Arr(findLightsIndexQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findLightsIndex.length ; j++) {
        let findLightsQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ? AND color = ? AND u_idx = ?';
        var findLights = await db.queryParamCnt_Arr(findLightsQuery, [findLightsIndex[j].light_idx, "r", u_idx]); // 색깔 : r y g
        if(findLights.length != 0) {
          let AgendaJson = findLightsIndex[j];
          GroupArray2.push(AgendaJson);
        }
      }// for(let j = 0)
      if(GroupArray2.length != 0) {
        GroupJson.name = searchGroupInfo[0];
        GroupJson.data = GroupArray2;
        LightsArray.push(GroupJson);
      }
    }// for(let i = 0)

    //투표 밀린 것
    let VotesArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let GroupArray3 = [];
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findVotesIndexQuery = 'SELECT * FROM chat.vote WHERE g_idx = ?';
      var findVotesIndex = await db.queryParamCnt_Arr(findVotesIndexQuery, [findUserJoined[i].g_idx]);
      for(let j = 0 ; j < findVotesIndex.length ; j++) {
        let findVotesQuery = 'SELECT * FROM chat.vote_response WHERE vote_idx = ? AND status = ? AND u_idx = ?';
        var findVotes = await db.queryParamCnt_Arr(findVotesQuery, [findVotesIndex[j].vote_idx, 0, u_idx]); // 미응답은 : w, 응답은 : a
        if(findVotes.length != 0) {
          let AgendaJson = findVotesIndex[j];
          GroupArray3.push(AgendaJson);
        }
      }// for(let j = 0)
      if(GroupArray3.length != 0) {
        GroupJson.name = searchGroupInfo[0];
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
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupNoticeQuery =
      `SELECT chat.notice.*, chat.user.photo, chat.user.name, chat.user.id FROM chat.notice
      JOIN chat.user USING(u_idx) WHERE g_idx = ? ORDER BY chat.notice.notice_idx DESC`;
      var findEachGroupNotice = await db.queryParamCnt_Arr(findEachGroupNoticeQuery, [findUserJoined[i].g_idx]);

      if(searchGroupInfo === undefined || findEachGroupNotice === undefined) {
        break;
      }
      // if(findEachGroupNotice.length != 0) {  //이 부분은 공지가 없을 시 그룹 이름이 보이지 않는 경우, 현재는 공지가 없어도 그룹이름이 보임
        result.push(
          {
            name : searchGroupInfo[0],
            data : findEachGroupNotice
          }
        );

      // }
    }
    if(!findUserJoined || !searchGroupInfo || ! findEachGroupNotice) {
      return false;
    } else {
      return result;
    }
  },
  homeLightsResponse : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupLightsQuery =
      `SELECT chat.user.photo, chat.user.name, chat.user.id, chat.lights.*, chat.light_response.color
      FROM chat.light_response JOIN (chat.user JOIN chat.lights USING(u_idx)) USING(light_idx)
      WHERE g_idx = ? AND chat.light_response.u_idx = ? AND chat.lights.u_idx != ? ORDER BY chat.lights.light_idx DESC`;
      var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx, u_idx, u_idx]);
      if(searchGroupInfo === undefined || findEachGroupLights === undefined) {
        break;
      }
      GroupJson.data = findEachGroupLights;
      GroupJson.name = searchGroupInfo[0];
      resArray.push(GroupJson);
    }


    if(!findUserJoined || !searchGroupInfo || !findEachGroupLights) {
      return false;
    } else {
      return resArray;
    }
  },
  homeLightsRequest : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? AND u_idx = ? ORDER BY chat.lights.light_idx DESC';
      var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx, u_idx]);

      if(searchGroupInfo === undefined || findEachGroupLights === undefined) {
        break;
      }
      GroupJson.data = findEachGroupLights;
      GroupJson.name = searchGroupInfo[0];
      reqArray.push(GroupJson);
    }

    if(!findUserJoined || !searchGroupInfo || !findEachGroupLights) {
      return false;
    } else {
      return reqArray;
    }
  },
  homePick : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupPickQuery =
      `SELECT chat.pick.* , chat.user.photo, chat.user.name, chat.user.id
      FROM chat.pick, chat.user WHERE chat.pick.write_id = chat.user.id
      AND chat.pick.u_idx = ? AND chat.pick.g_idx= ? ORDER BY write_time DESC`;
      var findEachGroupPick = await db.queryParamCnt_Arr(findEachGroupPickQuery, [u_idx, findUserJoined[i].g_idx]);

      if(searchGroupInfo === undefined || findEachGroupPick === undefined) {
        break;
      }
      result.push(
        {
          name : searchGroupInfo[0],
          data : findEachGroupPick
        }
      );
    }
    if(!findUserJoined || !searchGroupInfo || !findEachGroupPick) {
      return false;
    } else {
      return result;
    }
  },
  homeVoteResponse : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupVoteNotFinishedQuery =
      `SELECT chat.vote.*, chat.user.photo, chat.user.name, chat.user.id
      FROM chat.vote JOIN chat.user USING(u_idx) WHERE g_idx = ? AND u_idx != ? AND status = ? ORDER BY chat.vote.vote_idx DESC`;
      var findEachGroupVoteNotFinished = await db.queryParamCnt_Arr(findEachGroupVoteNotFinishedQuery, [findUserJoined[i].g_idx, u_idx, 0]);

      let findEachGroupVoteFinishedQuery =
      `SELECT chat.vote.*, chat.user.photo, chat.user.name, chat.user.id
      FROM chat.vote JOIN chat.user USING(u_idx) WHERE g_idx = ? AND u_idx != ? AND status = ? ORDER BY chat.vote.vote_idx DESC`;
      var findEachGroupVoteFinished = await db.queryParamCnt_Arr(findEachGroupVoteFinishedQuery, [findUserJoined[i].g_idx, u_idx, 1]);

      if(searchGroupInfo === undefined || findEachGroupVoteNotFinished === undefined || findEachGroupVoteFinished === undefined) {
        break;
      }
      GroupJson.name = searchGroupInfo[0];
      GroupJson.data = {
        NotFinished : findEachGroupVoteNotFinished,
        Finished : findEachGroupVoteFinished
      };
      resArray.push(GroupJson);
    }
    if(!findUserJoined || !searchGroupInfo || !findEachGroupVoteNotFinished || !findEachGroupVoteFinished) {
      return false;
    } else {
      return resArray;
    }
  },
  homeVoteRequest : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    //발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupVoteNotFinishedQuery = 'SELECT * FROM chat.vote WHERE g_idx = ? AND u_idx = ? AND status = ? ORDER BY chat.vote.vote_idx DESC';
      var findEachGroupVoteNotFinished = await db.queryParamCnt_Arr(findEachGroupVoteNotFinishedQuery, [findUserJoined[i].g_idx, u_idx, 0]);

      let findEachGroupVoteFinishedQuery = 'SELECT * FROM chat.vote WHERE g_idx = ? AND u_idx = ? AND status = ? ORDER BY chat.vote.vote_idx DESC';
      var findEachGroupVoteFinished = await db.queryParamCnt_Arr(findEachGroupVoteFinishedQuery, [findUserJoined[i].g_idx, u_idx, 1]);

      if(searchGroupInfo === undefined || findEachGroupVoteNotFinished === undefined || findEachGroupVoteFinished === undefined) {
        break;
      }
      GroupJson.name = searchGroupInfo[0];
      GroupJson.data = {
        NotFinished : findEachGroupVoteNotFinished,
        Finished : findEachGroupVoteFinished
      };
      reqArray.push(GroupJson);
    }

    if(!findUserJoined || !searchGroupInfo || !findEachGroupVoteNotFinished || !findEachGroupVoteFinished) {
      return false;
    } else {
      return reqArray;
    }
  },
  forEachNotice : async (...args) => {
    let g_idx = args[0];
    //let showAllNoticeQuery = 'SELECT * FROM chat.group JOIN chat.notice USING(g_idx) WHERE g_idx = ? ORDER BY write_time';  //이름 같이 전송해야 할 때
    let showAllNoticeQuery =
    `SELECT chat.notice.*, chat.user.photo, chat.user.name, chat.user.id
    FROM chat.notice JOIN chat.user USING(u_idx) WHERE g_idx = ? ORDER BY notice_idx DESC`;
    var showAllNotice = await db.queryParamCnt_Arr(showAllNoticeQuery, [g_idx]);
    if(!showAllNotice) {
      return false;
    } else {
      return showAllNotice;
    }
  },// forEachNotice
  forEachLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let findEachGroupLightsQuery =
    `SELECT chat.user.photo, chat.user.name, chat.user.id, chat.lights.*, chat.light_response.color
    FROM chat.light_response JOIN (chat.user JOIN chat.lights USING(u_idx)) USING(light_idx)
    WHERE g_idx = ? AND chat.light_response.u_idx = ? ORDER BY chat.lights.light_idx DESC`;
    var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [g_idx, u_idx]);

    if(!findEachGroupLights) {
      return false;
    } else {
      return findEachGroupLights;
    }
  },// forEachLights
  forEachLightsStatus : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let light_idx = args[2];

    let findEachGroupLightsStatusQuery = 'SELECT u_idx FROM chat.lights WHERE g_idx = ? AND light_idx = ?';
    var findEachGroupLightsStatus = await db.queryParamCnt_Arr(findEachGroupLightsStatusQuery, [g_idx, light_idx]);

    if(u_idx === findEachGroupLightsStatus[0].u_idx) {
      return true;
    } else {
      return false;
    }
  },
  forEachLightsResponse : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let light_idx = args[2];
    let color = args[3];
    let result;

    let findEachGroupLightsResQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? AND light_idx = ?';
    var findEachGroupLightsRes = await db.queryParamCnt_Arr(findEachGroupLightsResQuery, [g_idx, light_idx]);

    if(findEachGroupLightsRes[0].open_status === 1) {  //true check
      let findEachGroupLightsResAllQuery =
      `SELECT chat.light_response.*, chat.user.photo, chat.user.name
      FROM chat.light_response JOIN chat.user USING(u_idx) WHERE light_idx = ? AND color = ?`;
      var findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [light_idx, color]);

      result = findEachGroupLightsResAll;
    } else {
      let findEachGroupLightsResAloneQuery =
      `SELECT chat.light_response.*, chat.user.photo, chat.user.name
      FROM chat.light_response JOIN chat.user USING(u_idx) WHERE u_idx = ? AND light_idx = ? AND color = ?`;
      var findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [u_idx, light_idx, color]);

      result = findEachGroupLightsResAlone;
    }

    if(!findEachGroupLightsRes) {
      return false;
    } else {
      return result;
    }
  },//forEachLightsResponse
  forEachPick : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let showAllPickQuery =
    `SELECT chat.pick.*, chat.user.photo, chat.user.name, chat.user.id
    FROM chat.pick, chat.user WHERE chat.pick.write_id = chat.user.id
    AND chat.pick.u_idx = ? AND chat.pick.g_idx = ?
    ORDER BY write_time DESC`;
    var showAllPick = await db.queryParamCnt_Arr(showAllPickQuery, [u_idx, g_idx]);

    if(!showAllPick) {
      return false;
    } else {
      return showAllPick;
    }
  },// forEachPick
  forEachVote : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let showAllVoteNotFinishedQuery =
    `SELECT chat.vote.*, chat.user.photo, chat.user.name, chat.user.id
    FROM chat.vote JOIN chat.user USING(u_idx) WHERE g_idx = ? AND status = ? ORDER BY chat.vote.vote_idx DESC`;
    var showAllVoteNotFinished = await db.queryParamCnt_Arr(showAllVoteNotFinishedQuery, [g_idx, 0]);

    let showAllVoteFinishedQuery =
    `SELECT chat.vote.*, chat.user.photo, chat.user.name, chat.user.id
    FROM chat.vote JOIN chat.user USING(u_idx) WHERE g_idx = ? AND status = ? ORDER BY chat.vote.vote_idx DESC`;
    var showAllVoteFinished = await db.queryParamCnt_Arr(showAllVoteFinishedQuery, [g_idx, 1]);

    if(!showAllVoteNotFinished || !showAllVoteFinished) {
      return false;
    } else {
      return {
        NotFinished : showAllVoteNotFinished,
        Finished : showAllVoteFinished
      };
    }
  },// forEachVote
  forEachVoteResponse : async (...args) => {
    let g_idx = args[0];
    let vote_idx = args[1];

    let findEachGroupVoteResAllQuery =
    `SELECT chat.vote_response.*, chat.user.u_idx, chat.user.name, chat.user.phone, chat.user.bio, chat.user.photo, chat.user.id
    FROM chat.vote_response JOIN chat.user USING(u_idx) WHERE vote_idx = ?`;
    var findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [vote_idx]);

    return findEachGroupVoteResAll;
  },//forEachVoteResponse
  makeNotice : async (...args) => {
    let u_idx = args[0];
    let chat_idx = args[1];
    let g_idx = args[2];
    let write_time = args[3];
    let content = args[4];

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertNoticeQuery = 'INSERT INTO chat.notice (u_idx, chat_idx, g_idx, write_time, content) VALUES (?, ?, ?, ?, ?)';
    var insertNotice = await db.queryParamCnt_Arr(insertNoticeQuery, [u_idx, chat_idx, g_idx, write_time, content]);

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ? AND u_idx != ?';
    var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx, u_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertNoticeResponseQuery = 'INSERT INTO chat.notice_response (notice_idx, u_idx, status) VALUES (?, ?, ?)';
      var insertNoticeResponse = await db.queryParamCnt_Arr(insertNoticeResponseQuery, [insertNotice.insertId, searchAllUsersInSpecificGroup[i].u_idx, 0]);
    }
    if(!insertNotice || !searchAllUsersInSpecificGroup) {
      return false;
    } else {
      return true;
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
    var insertLights = await db.queryParamCnt_Arr(insertLightsQuery, [u_idx, g_idx, open_status, entire_status, content, write_time, chat_idx]);
    console.log('insertLights',insertLights);
    if(entire_status == 1) {
//      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ? AND u_idx != ?';
      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ?';
      var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx, u_idx]);
      console.log('searchAllUsersInSpecificGroup',searchAllUsersInSpecificGroup);
      for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
        if(searchAllUsersInSpecificGroup[i].u_idx === u_idx) {
          let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
          var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, searchAllUsersInSpecificGroup[i].u_idx, "a", null, null]);
          console.log('insertLightsResponse',insertLightsResponse);
        } else {
          let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
          var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, searchAllUsersInSpecificGroup[i].u_idx, "r", null, null]);
          console.log('insertLightsResponse',insertLightsResponse);
        }
      }
    } else {
      let insertLightsResponseMakerQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
      var insertLightsResponseMaker = await db.queryParamCnt_Arr(insertLightsResponseMakerQuery, [insertLights.insertId, u_idx, "a", null, null]);
      for(let j = 0 ; j < userArray.length ; j++) {
        console.log(userArray[j]);
        let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
        var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, userArray[j], "r", null, null]);
        console.log('insertLightsResponse',insertLightsResponse);
      }
    }
    if(!insertLights) {
      return false;
    } else {
      return true;
    }
  },
  makePick : async (...args) => {
    let u_idx = args[0];
    let write_id = args[1];
    let chat_idx = args[2];
    let g_idx = args[3];
    let write_time = args[4];
    let content = args[5];

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertPickQuery = 'INSERT INTO chat.pick (u_idx, write_id, chat_idx, g_idx, write_time, content) VALUES (?, ?, ?, ?, ?, ?)';
    var insertPick = await db.queryParamCnt_Arr(insertPickQuery, [u_idx, write_id, chat_idx, g_idx, write_time, content]);
    if(!insertPick) {
      return false;
    } else {
      return true;
    }
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
    var insertVote = await db.queryParamCnt_Arr(insertVoteQuery, [u_idx, chat_idx, g_idx, write_time, content, title]);

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ? AND u_idx != ?';
    var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx, u_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertLightsResponseQuery = 'INSERT INTO chat.vote_response (vote_idx, u_idx, status, value, write_time, g_idx) VALUES (?, ?, ?, ?, ?, ?)';
      var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertVote.insertId, searchAllUsersInSpecificGroup[i].u_idx, 0, null, null, g_idx]);
    }
    if(!insertVote || !searchAllUsersInSpecificGroup) {
      return false;
    } else {
      return true;
    }
  },
  actionNotice : async (...args) => {
    let u_idx = args[0];
    let notice_idx = args[1];
    let updateNoticeResQuery = 'UPDATE chat.notice_response SET status = ? WHERE notice_idx = ? AND u_idx = ?';
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
    let updateLightsResQuery = 'UPDATE chat.light_response SET color = ?, content = ?, write_time = ? WHERE light_idx = ? AND u_idx = ?';
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

    let updateVoteResQuery = 'UPDATE chat.vote_response SET value = ?, write_time = ?, status = ? WHERE vote_idx = ? AND u_idx = ?';
    var updateVoteRes = await db.queryParamCnt_Arr(updateVoteResQuery, [value, write_time, 1, vote_idx, u_idx]);
    if(!updateVoteRes) {
      return false;
    } else {
      return true;
    }
  },
  showSpecificMemberInChat : async (...args) => {
    let g_idx = args[0];

    let getUsersListInGroupQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ?';
    var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx]);
    let result = [];
    for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT u_idx, name, photo, id FROM chat.user WHERE u_idx = ?';
      var getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
      result.push(getUsersInfo[0]);
    }
    if(!getUsersListInGroup) {
      return false;
    } else {
      return result;
    }
  },
  showSpecificMemberInLights : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let getUsersListInGroupQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ? AND u_idx != ?';
    var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx, u_idx]);
    let result = [];

    for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT u_idx, name, photo, id FROM chat.user WHERE u_idx = ?';
      var getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
      result.push(getUsersInfo[0]);
    }
    if(!getUsersListInGroup) {
      return false;
    } else {
      return result;
    }
  },
  // showChatLists : async (...args) => {
  //   let u_idx = args[0];
  //
  //   let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
  //   var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
  //   let result = [];
  //   for(let i = 0 ; i < findUserJoined.length ; i++) {
  //     let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
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

    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);
      result.push(searchGroupInfo[0]);
    }
    if(!findUserJoined) {
      return false;
    } else {
      return result;
    }
  },
  leaveRoom : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let leaveGroupQuery = 'DELETE FROM chat.joined WHERE g_idx = ? AND u_idx = ?';
    var leaveGroup = await db.queryParamCnt_Arr(leaveGroupQuery, [g_idx, u_idx]);
    if(!leaveGroup) {
      return false;
    } else {
      let leftPersonCountQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ?';
      var leftPersonCount = await db.queryParamCnt_Arr(leftPersonCountQuery, [g_idx]);
      if(leftPersonCount.length === 0) {
        let deleteGroupInfoQuery = 'DELETE FROM chat.group WHERE g_idx = ?';
        var deleteGroupInfo = await db.queryParamCnt_Arr(deleteGroupInfoQuery, [g_idx]);
      }
      return leaveGroup;
    }
  },
  closeVote : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let vote_idx = args[2];

    let voteCloseQuery = 'UPDATE chat.vote SET status = ? WHERE u_idx = ? AND g_idx = ? AND vote_idx = ?';
    var voteCloseResult = await db.queryParamCnt_Arr(voteCloseQuery, [1, u_idx, g_idx, vote_idx]);
    if(!voteCloseResult) {
      return false;
    } else {
      return true;
    }
  },
  sendFCMData : async (...args) => {
    /*
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
    let status = args[0];
    let idx = args[1];

    if(status === statuscode.groupChange || status === statuscode.joinedChange) {
      let getAllUserQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ?';
      var getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [idx]);
      //getAllUserQuery 하고 getUserTokenQuery 하고 JOIN 할 수 있을 것 같은데
      for(let i = 0 ; i < getAllUser.length ; i++) {
        let getUserTokenQuery = 'SELECT token FROM chat.user WHERE u_idx = ?';
        var getUserToken = await db.queryParamCnt_Arr(getUserTokenQuery, [getAllUser[i].u_idx]);
        let client_token = getUserToken[0].token;

        if(status === 0) {
          var message_data = statuscode.groupChange;
        } else {
          var message_data = statuscode.joinedChange;
        }

        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: client_token,
            data: {
              data : message_data
            }
        };

        fcm.send(message, function(err, response) {
          if(err) {
            console.log("Something has gone wrong!", err);
            return false;
          } else {
            console.log("Successfully sent with response: ", response);
            return true;
          }
        });//fcm.send
      }//for(j=0)
    } else if(statuscode === statuscode.userChange) {  //status === 2
      let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
      var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [idx]);

      let userArray = [];
      for(let i = 0 ; i < findUserJoined.length ; i++) {
        let getAllUserQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ?';
        var getAllUser = await db.queryParamCnt_Arr(getAllUserQuery, [findUserJoined[i].g_idx]);

        //getAllUserQuery 하고 getUserTokenQuery 하고 JOIN 할 수 있을 것 같은데
        for(let j = 0 ; j < getAllUser.length ; j++) {
          userArray.push(getAllUser[j].u_idx);
        }
        console.log(userArray);
      }
      let userArray_wo_dup = Array.from(new Set(userArray));

      for(let i = 0 ; i < userArray_wo_dup.length ; i++) {
        if(userArray_wo_dup[i] === idx) {
          continue;
        }
        let getUserTokenQuery = 'SELECT token FROM chat.user WHERE u_idx = ?';
        var getUserToken = await db.queryParamCnt_Arr(getUserTokenQuery, [userArray_wo_dup[i].u_idx]);
        let client_token = getUserToken[0].token;

        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: client_token,
            data: {
              data : statuscode.userChange
            }
        };
        fcm.send(message, function(err, response) {
          if(err) {
            console.log("Something has gone wrong!", err);
            return false;
          } else {
            console.log("Successfully sent with response: ", response);
            return true;
          }
        });//fcm.send
      }
    } else if(status === statuscode.groupNewJoin) {
      let getUserTokenQuery = 'SELECT token FROM chat.user WHERE u_idx = ?';
      var getUserToken = await db.queryParamCnt_Arr(getUserTokenQuery, [idx]);
      let client_token = getUserToken[0].token;

      var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
          to: client_token,
          data: {
            data : statuscode.groupChange
          }
      };

      fcm.send(message, function(err, response) {
        if(err) {
          console.log("Something has gone wrong!", err);
          return false;
        } else {
          console.log("Successfully sent with response: ", response);
          return true;
        }
      });//fcm.send

    } else {
      return false;
    }
  },//sendFCMData
  getJoinedInfo : async (...args) => {
    let u_idx = args[0];
    let resultArray = [];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findAllUserJoinedQuery = 'SELECT * FROM chat.joined WHERE g_idx = ?';
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
  getUserInfo : async (...args) => {
    let u_idx = args[0];

    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    let userArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findAllUserQuery = 'SELECT u_idx FROM chat.joined WHERE g_idx = ?';
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
      let findUserDetailInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM chat.user WHERE u_idx = ?';
      var findUserDetailInfo = await db.queryParamCnt_Arr(findUserDetailInfoQuery, [userArray_wo_dup[i]]);

      result.push(findUserDetailInfo[0]);
    }
    return result;
  },
  addCalender : async (...args) => {
    let g_idx = args[0];
    let title = args[1];
    let location = args[2];
    let memo = args[3];
    let starttime = args[4];
    let endtime = args[5];

    let insertCalenderQuery = 'INSERT INTO chat.calender (g_idx, title, location, memo, starttime, endtime) VALUES (?, ?, ?, ?, ?, ?)';
    var insertCalender = await db.queryParamCnt_Arr(insertCalenderQuery, [g_idx, title, location, memo, starttime, endtime]);

    if(!insertCalender) {
      return false;
    } else {
      return true;
    }
  },
  showCalender : async (...args) => {
    //일정에 색깔 어떻게 표현할거냐?
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM chat.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let searchCalenderInfoQuery =
      `
      SELECT * FROM chat calender WHERE g_idx = ?
      AND ( starttime > ? AND starttime < ? ) OR ( endtime > ? AND endtime < ? )
      `;
      var searchCalenderInfo = await db.queryParamCnt_Arr(searchCalenderInfoQuery, [findUserJoined[i].g_idx]);

      if(searchGroupInfo === undefined || searchCalenderInfo === undefined) {
        break;
      }
      result.push(
        {
          name : searchGroupInfo[0],
          data : searchCalenderInfo
        }
      );
    }//for
    if(!findUserJoined || !searchGroupInfo || !searchCalenderInfo) {
      return false;
    } else {
      return result;
    }
  },
  pushCalender : async (...args) => {
    return true;
  },
  modifyCalender : async (...args) => {
    let cal_idx = args[0];
    let title = args[1];
    let location = args[2];
    let memo = args[3];
    let starttime = args[4];
    let endtime = args[5];

    //이거는 라우터에서 실행하자
    // let getCalenderQuery = 'SELECT * FROM chat.calender WHERE cal_idx = ?';
    // var getCalender = await db.queryParamCnt_Arr(getCalenderQuery, [cal_idx]);
    let updateCalenderQuery = 'UPDATE chat.calender SET title = ? AND location = ? AND memo = ? AND starttime = ? AND endtime = ? WHERE cal_idx = ?';
    var updateCalender = await db.queryParamCnt_Arr(updateCalenderQuery, [title, location, memo, starttime, endtime, cal_idx]);

    if(!updateCalender) {
      return false;
    } else {
      return true;
    }
  },
  deleteCalender : async (...args) => {
    let cal_idx = args[0];

    let deleteCalenderQuery = 'DELETE FROM chat.calender WHERE cal_idx = ?';
    var deleteCalender = await db.queryParamCnt_Arr(deleteCalenderQuery, [cal_idx]);

    if(!deleteCalender) {
      return false;
    } else {
      return true;
    }
  }
};
