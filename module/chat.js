const db = require('./pool.js');

module.exports = {
	makeNewChatroomTable : async (...args) => {
		let ctrl_name = args[0];

		let createTableQuery = `
		CREATE TABLE IF NOT EXISTS chat.` + ctrl_name + ` (
      chat_idx INT(11) NOT NULL AUTO_INCREMENT,
      content TEXT NULL DEFAULT NULL,
      write_time VARCHAR(45) NULL DEFAULT NULL,
      count INT(11) NULL DEFAULT NULL,
      u_idx INT(11) NULL DEFAULT NULL,
      PRIMARY KEY (chat_idx))
    ENGINE = InnoDB
    DEFAULT CHARACTER SET = utf8`;
    let createTable = await db.queryParamCnt_None(createTableQuery);
    console.log(createTable);
    return createTable;
	}
};