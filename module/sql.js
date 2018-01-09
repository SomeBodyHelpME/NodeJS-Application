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
  joinNewPerson : async (...args) => {
    const g_idx = args[0];
    const u_idx = args[1];

    let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);
    let searchUserInfoQuery = 'SELECT * FROM admin.user WHERE u_idx = ?';
    var searchUserInfo = await db.queryParamCnt_Arr(searchUserInfoQuery, [u_idx]);

    let insertUserInfoQuery = 'INSERT INTO admin.joined (u_idx, g_idx) VALUES (?,?)';
    var insertUserInfo = await db.queryParamCnt_Arr(insertUserInfoQuery, [u_idx, g_idx]);

    if(!searchGroupInfo || !searchUserInfo || !insertUserInfo) {
      return false;
    } else {
      return true;
    }
  },// joinNewPerson
  findAllGroupMemberAddr : async (...args) => {
    const u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let findGroupNameQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var findGroupName = await db.queryParamCnt_Arr(findGroupNameQuery, [findUserJoined[i].g_idx]);
      let findUserIndexQuery = 'SELECT * FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
      var findUserIndex = await db.queryParamCnt_Arr(findUserIndexQuery, [findUserJoined[i].g_idx, u_idx]);
      let GroupArray = [];
      for(let j = 0 ; j < findUserIndex.length ; j++) {
        let findUserDetailInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM admin.user WHERE u_idx = ?';
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
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
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
        let findNoticeQuery = 'SELECT * FROM chat.notice_response WHERE notice_idx = ? AND status = ? AND u_idx';
        var findNotice = await db.queryParamCnt_Arr(findNoticeQuery, [findNoticeIndex[j].notice_idx, false, u_idx]);
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
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findLightsIndexQuery = 'SELECT * FROM chat.lights WHERE g_idx = ?';
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
    if(!findUserJoined || !searchGroupInfo || !findNoticeIndex || !findNotice || !findLightsIndex || !findLights || !findVotesIndex || !findVotes) {
      return false;
    } else {
      return result;
    }
  },// findRestGroupThings(그룹별로 보여줄 때)
  homeNotice : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupNoticeQuery = 'SELECT * FROM chat.notice WHERE g_idx = ? ORDER BY chat.notice.notice_idx DESC';
      var findEachGroupNotice = await db.queryParamCnt_Arr(findEachGroupNoticeQuery, [findUserJoined[i].g_idx]);

      result.push(
        {
          name : searchGroupInfo[0],
          data : findEachGroupNotice
        }
      );
    }
    if(!findUserJoined || !searchGroupInfo || !findEachGroupNotice) {
      return false;
    } else {
      return result;
    }
  },
  homeLightsResponse : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? ORDER BY chat.lights.light_idx DESC';
      var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupLights.length ; j++) {

        if(findEachGroupLights[j].open_status === true) {  //true check
          let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ?';
          let findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [findEachGroupLights[j].light_idx]);
          if(findEachGroupLightsResAll.length != 0) {
            groupArray.push(findEachGroupLights[j]);
          }
        } else {
          let findEachGroupLightsResAloneQuery = 'SELECT * FROM chat.light_response WHERE u_idx = ? AND light_idx = ?';
          let findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [u_idx, findEachGroupLights[j].light_idx]);
          if(findEachGroupLightsResAlone.length != 0) {
            groupArray.push(findEachGroupLights[j]);
          }
        }
      }
      GroupJson.name = searchGroupInfo[0];
      GroupJson.data = groupArray;
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
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? AND u_idx = ? ORDER BY chat.lights.light_idx DESC';
      var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [findUserJoined[i].g_idx, u_idx]);

      GroupJson.name = searchGroupInfo[0];
      GroupJson.data = findEachGroupLights;
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
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);
    let result = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupPickQuery = 'SELECT * FROM chat.pick WHERE u_idx = ? AND g_idx = ? ORDER BY write_time DESC';
      var findEachGroupPick = await db.queryParamCnt_Arr(findEachGroupPickQuery, [u_idx, findUserJoined[i].g_idx]);
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
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    // 수신자에 대한 내용
    let resArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupVoteQuery = 'SELECT * FROM chat.vote WHERE g_idx = ? ORDER BY chat.vote.vote_idx DESC';
      var findEachGroupVote = await db.queryParamCnt_Arr(findEachGroupVoteQuery, [findUserJoined[i].g_idx]);
      let groupArray = [];
      for(let j = 0 ; j < findEachGroupVote.length ; j++) {
        let findEachGroupVoteResAllQuery = 'SELECT * FROM chat.vote_response JOIN admin.user USING(u_idx) WHERE g_idx = ? AND vote_idx = ?';
        var findEachGroupVoteResAll = await db.queryParamCnt_Arr(findEachGroupVoteResAllQuery, [findUserJoined[i].g_idx, findEachGroupVote[j].vote_idx]);

        groupArray.push(findEachGroupVote[j]);
      }
      GroupJson.name = searchGroupInfo[0];
      GroupJson.data = groupArray;
      resArray.push(GroupJson);
    }


    if(!findUserJoined || !searchGroupInfo || !findEachGroupVote) {
      return false;
    } else {
      return resArray;
    }
  },
  homeVoteRequest : async (...args) => {
    let u_idx = args[0];
    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
    var findUserJoined = await db.queryParamCnt_Arr(findUserJoinedQuery, [u_idx]);

    //발신자에 대한 내용
    let reqArray = [];
    for(let i = 0 ; i < findUserJoined.length ; i++) {
      let GroupJson = {};
      let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
      var searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [findUserJoined[i].g_idx]);

      let findEachGroupVoteQuery = 'SELECT * FROM chat.vote WHERE g_idx = ? ORDER BY chat.vote.vote_idx DESC';
      var findEachGroupVote = await db.queryParamCnt_Arr(findEachGroupVoteQuery, [findUserJoined[i].g_idx]);

      GroupJson.name = searchGroupInfo[0];
      GroupJson.data = findEachGroupVote;
      reqArray.push(GroupJson);
    }

    if(!findUserJoined || !searchGroupInfo || !findEachGroupVote) {
      return false;
    } else {
      return reqArray;
    }
  },
  forEachNotice : async (...args) => {
    let g_idx = args[0];
    //let showAllNoticeQuery = 'SELECT * FROM chat.group JOIN chat.notice USING(g_idx) WHERE g_idx = ? ORDER BY write_time';  //이름 같이 전송해야 할 때
    let showAllNoticeQuery = 'SELECT * FROM chat.notice WHERE g_idx = ? ORDER BY notice_idx DESC';
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

    let findEachGroupLightsQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? ORDER BY chat.lights.light_idx DESC';
    var findEachGroupLights = await db.queryParamCnt_Arr(findEachGroupLightsQuery, [g_idx]);

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

    if(u_idx === findEachGroupLightsStatus) {
      return true;
    } else {
      return false;
    }
  },
  forEachLightsResponse : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];
    let light_idx = args[2];
    let result;

    let findEachGroupLightsResQuery = 'SELECT * FROM chat.lights WHERE g_idx = ? AND light_idx = ?';
    var findEachGroupLightsRes = await db.queryParamCnt_Arr(findEachGroupLightsResQuery, [g_idx, light_idx]);

    if(findEachGroupLightsRes[0].open_status === 1) {  //true check
      let findEachGroupLightsResAllQuery = 'SELECT * FROM chat.light_response WHERE light_idx = ?';
      var findEachGroupLightsResAll = await db.queryParamCnt_Arr(findEachGroupLightsResAllQuery, [light_idx]);
      if(findEachGroupLightsResAll.length != 0) {
        result = findEachGroupLightsResAll;
      }
    } else {
      let findEachGroupLightsResAloneQuery = 'SELECT * FROM chat.light_response WHERE u_idx = ? AND light_idx = ?';
      var findEachGroupLightsResAlone = await db.queryParamCnt_Arr(findEachGroupLightsResAloneQuery, [u_idx, light_idx]);
      if(findEachGroupLightsResAlone.length != 0) {
        result = findEachGroupLightsResAlone;
      }
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
    let showAllPickQuery = 'SELECT * FROM chat.pick WHERE u_idx = ? AND g_idx = ? ORDER BY write_time DESC';
    var showAllPick = await db.queryParamCnt_Arr(showAllPickQuery, [u_idx, g_idx]);
    // res.status(200).send({
    //   message : "success",
    //   data : showAllPick
    // });
    if(!showAllPick) {
      return false;
    } else {
      return showAllPick;
    }
  },// forEachPick
  forEachVote : async (...args) => {
    let u_idx = args[0];
    let g_idx = args[1];

    let showAllVoteQuery = 'SELECT * FROM chat.vote WHERE g_idx = ? ORDER BY chat.vote.vote_idx DESC';
    var showAllVote = await db.queryParamCnt_Arr(showAllVoteQuery, [g_idx]);

    if(!showAllVote) {
      return false;
    } else {
      return showAllVote;
    }
  },// forEachVote
  forEachVoteResponse : async (...args) => {
    let g_idx = args[0];
    let vote_idx = args[1];

    let findEachGroupVoteResAllQuery = 'SELECT chat.vote_response.*, admin.user.u_idx, admin.user.name, admin.user.phone, admin.user.bio, admin.user.photo, admin.user.id FROM chat.vote_response JOIN admin.user USING(u_idx) WHERE vote_idx = ?';
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

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
    var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx, u_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertNoticeResponseQuery = 'INSERT INTO chat.notice_response (notice_idx, u_idx, status) VALUES (?, ?, ?)';
      var insertNoticeResponse = await db.queryParamCnt_Arr(insertNoticeResponseQuery, [insertNotice.insertId, searchAllUsersInSpecificGroup[i].u_idx, false]);
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

    if(entire_status === '1') {
      let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
      var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx, u_idx]);
      console.log(searchAllUsersInSpecificGroup);
      for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
        let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
        var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, searchAllUsersInSpecificGroup[i].u_idx, "r", null, null]);
      }
    } else {
      for(let i = 0 ; i < userArray.length ; i++) {
        let insertLightsResponseQuery = 'INSERT INTO chat.light_response (light_idx, u_idx, color, content, write_time) VALUES (?, ?, ?, ?, ?)';
        var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertLights.insertId, userArray[i].u_idx, "r", null, null]);
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
    let chat_idx = args[1];
    let g_idx = args[2];
    let write_time = args[3];
    let content = args[4];

    // let searchGroupInfoQuery = 'SELECT * FROM chat.group WHERE g_idx = ?';
    // let searchGroupInfo = await db.queryParamCnt_Arr(searchGroupInfoQuery, [g_idx]);

    let insertPickQuery = 'INSERT INTO chat.pick (u_idx, chat_idx, g_idx, write_time, content) VALUES (?, ?, ?, ?, ?)';
    var insertPick = await db.queryParamCnt_Arr(insertPickQuery, [u_idx, chat_idx, g_idx, write_time, content]);
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

    let searchAllUsersInSpecificGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
    var searchAllUsersInSpecificGroup = await db.queryParamCnt_Arr(searchAllUsersInSpecificGroupQuery, [g_idx, u_idx]);
    for(let i = 0 ; i < searchAllUsersInSpecificGroup.length ; i++) {
      let insertLightsResponseQuery = 'INSERT INTO chat.vote_response (vote_idx, u_idx, status, value, write_time) VALUES (?, ?, ?, ?, ?)';
      var insertLightsResponse = await db.queryParamCnt_Arr(insertLightsResponseQuery, [insertVote.insertId, searchAllUsersInSpecificGroup[i].u_idx, 0, null, null]);
    }
    if(!insertVote || !searchAllUsersInSpecificGroup) {
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

    let getUsersListInGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ?';
    var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx]);
    let result = [];
    for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM admin.user WHERE u_idx = ?';
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

    let getUsersListInGroupQuery = 'SELECT u_idx FROM admin.joined WHERE g_idx = ? AND u_idx != ?';
    var getUsersListInGroup = await db.queryParamCnt_Arr(getUsersListInGroupQuery, [g_idx, u_idx]);
    let result = [];

    for(let i = 0 ; i < getUsersListInGroup.length ; i++) {
      let getUsersInfoQuery = 'SELECT u_idx, name, phone, bio, photo, id FROM admin.user WHERE u_idx = ?';
      var getUsersInfo = await db.queryParamCnt_Arr(getUsersInfoQuery, [getUsersListInGroup[i].u_idx]);
      result.push(getUsersInfo[0]);
    }
    if(!getUsersListInGroup) {
      return false;
    } else {
      return result;
    }
  },
  showChatLists : async (...args) => {
    let u_idx = args[0];

    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
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
  showAllGroupsJoined : async (...args) => {
    let u_idx = args[0];

    let findUserJoinedQuery = 'SELECT g_idx FROM admin.joined WHERE u_idx = ?';
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

    let leaveGroupQuery = 'DELETE FROM admin.joined WHERE g_idx = ? AND u_idx = ?';
    var leaveGroup = await db.queryParamCnt_Arr(leaveGroupQuery, [g_idx, u_idx]);
    if(!leaveGroup) {
      return false;
    } else {
      return leaveGroup;
    }
  },
  voteClose : async (...args) => {
    let g_idx = args[0];
    let vote_idx = args[1];

    let voteCloseQuery = 'UPDATE chat.vote SET status = ? WHERE g_idx = ? AND vote_idx = ?';
    let voteCloseResult = await db.queryParamCnt_Arr(voteCloseQuery, [1, g_idx, vote_idx]);
    if(!voteCloseResult) {
      return false;
    } else {
      return true;
    }
  }
};
